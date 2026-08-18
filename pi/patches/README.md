# Local Pi package patches

`mitsupi-1.6.0-prompt-editor.patch` is an exact-context local patch for the
pinned `npm:mitsupi@1.6.0` package. It adds native Pi `max` thinking support to
both prompt-editor thinking paths, removes the fresh-profile convenience mode
named `fast`, and adapts the mode model picker from Pi's extension-facing
`ModelRegistry` to the current `ModelSelectorComponent` runtime contract.
`/fast` remains the separate `pi-openai-fast` service-tier extension.

`pi/install.sh` validates both profile copies before applying the patch. It
accepts only the original 1.6.0 context or the already-patched context and
fails without profile mutation for an unknown version or context. Do not
refresh or apply this patch to another Mitsupi release without a reviewed
context update.
