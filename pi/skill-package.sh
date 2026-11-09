# Shared read-only validation for the explicitly selected local skills package.
# Validate required entry-point fields, not arbitrary YAML extension metadata.
external_skill_package_is_valid() {
  external_package="$1"
  jq -e '.name == "mu-stack" and .pi.skills == ["./skills"] and .pi.extensions == [] and .pi.prompts == [] and .pi.themes == []' \
    "$external_package/package.json" >/dev/null 2>&1 || return 1
  [ -d "$external_package/skills" ] || return 1
  external_skill_count=0
  for external_skill in "$external_package/skills"/*; do
    [ -d "$external_skill" ] || continue
    [ -s "$external_skill/SKILL.md" ] || return 1
    # Required names are directory slugs. Descriptions may be scalars or YAML
    # blocks; block descriptions must contain a nonempty indented line.
    awk -v expected="$(basename "$external_skill")" '
      NR == 1 { if ($0 != "---") exit 1; next }
      $0 == "---" { closed=1; exit }
      /^name:[[:space:]]*/ {
        value=$0; sub(/^name:[[:space:]]*/, "", value)
        gsub(/[\047\042]/, "", value)
        if (value == expected && value ~ /^[a-z0-9]+(-[a-z0-9]+)*$/) name=1
      }
      /^description:[[:space:]]*/ {
        value=$0; sub(/^description:[[:space:]]*/, "", value)
        gsub(/[\047\042]/, "", value)
        if (value ~ /^[>|][-+]?$/) block=1
        else if (value ~ /[^[:space:]]/ && value != "null" && value != "~") description=1
        next
      }
      block && /^[[:space:]]+[^[:space:]]/ { description=1; block=0 }
      block && /^[^[:space:]]/ { block=0 }
      END { if (!closed || !name || !description) exit 1 }
    ' "$external_skill/SKILL.md" || return 1
    external_skill_count=$((external_skill_count + 1))
  done
  [ "$external_skill_count" -gt 0 ]
}
