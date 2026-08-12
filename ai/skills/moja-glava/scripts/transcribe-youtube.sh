#!/bin/sh
# Acquire normalized YouTube metadata and a local transcript for the moja-glava skill.

set -eu

usage() {
  echo "Usage: transcribe-youtube.sh <youtube-url> <output-directory>" >&2
  exit 2
}

fail() {
  echo "transcribe-youtube.sh: $*" >&2
  exit 1
}

[ "$#" -eq 2 ] || usage

url="$1"
output_dir="$2"

[ -n "$url" ] || fail "YouTube URL is empty"
[ -n "$output_dir" ] || fail "output directory is empty"

for command_name in yt-dlp parakeet-mlx jq; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required"
done

mkdir -p "$output_dir" || fail "could not create output directory: $output_dir"
[ -d "$output_dir" ] || fail "output path is not a directory: $output_dir"

temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT HUP INT TERM

raw_metadata="$temporary_dir/youtube.json"
normalized_metadata="$temporary_dir/metadata.json"
transcript_output="$temporary_dir/transcript"
mkdir -p "$transcript_output"

if ! yt-dlp --no-playlist --dump-single-json --skip-download -- "$url" >"$raw_metadata"; then
  fail "could not fetch YouTube metadata"
fi

if ! jq '{
  id,
  title,
  channel: (.channel // .uploader // "Unknown"),
  channel_url: (.channel_url // .uploader_url),
  published: (
    if ((.upload_date // "") | test("^[0-9]{8}$"))
    then (.upload_date[0:4] + "-" + .upload_date[4:6] + "-" + .upload_date[6:8])
    else null
    end
  ),
  duration_seconds: .duration,
  duration: .duration_string,
  url: (.webpage_url // .original_url),
  description
}' "$raw_metadata" >"$normalized_metadata"; then
  fail "could not normalize YouTube metadata"
fi

if [ "$(jq -r '.title // empty' "$normalized_metadata")" = "" ]; then
  fail "YouTube metadata did not include a title"
fi

if ! yt-dlp --no-playlist -x --audio-format wav -o "$temporary_dir/audio.%(ext)s" -- "$url" >/dev/null 2>&1; then
  fail "could not download YouTube audio"
fi

audio_file="$(find "$temporary_dir" -maxdepth 1 -type f -name 'audio*.wav' -print | head -1)"
[ -n "$audio_file" ] && [ -f "$audio_file" ] || fail "downloaded audio was not found"

if ! parakeet-mlx --output-format txt --output-dir "$transcript_output" "$audio_file" >/dev/null 2>&1; then
  fail "transcription failed"
fi

transcript_file="$(find "$transcript_output" -maxdepth 1 -type f -name '*.txt' -print | head -1)"
[ -n "$transcript_file" ] && [ -s "$transcript_file" ] || fail "transcription produced no text"

metadata_destination="$output_dir/metadata.json"
transcript_destination="$output_dir/transcript.txt"

cp "$normalized_metadata" "$metadata_destination.tmp"
cp "$transcript_file" "$transcript_destination.tmp"
mv "$metadata_destination.tmp" "$metadata_destination"
mv "$transcript_destination.tmp" "$transcript_destination"

jq -cn \
  --arg metadata "$metadata_destination" \
  --arg transcript "$transcript_destination" \
  '{status: "created", metadata: $metadata, transcript: $transcript}'
