const FORM_CONTROLS = 'input, select, textarea';
const LIVE_REGIONS = '[aria-live], [role="alert"], [role="status"], [role="log"]';

function plainCopyText(element) {
  // Complex markup can change accessible names. Do not approximate the AccName algorithm.
  if (!element || element.children.length || element.hasAttribute('role') ||
      element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby') ||
      element.closest(LIVE_REGIONS)) return null;
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

/** Find duplicate descriptions in a Document; advisory only, never mutate the DOM or infer semantic redundancy. */
export function findDuplicateDescriptions(document) {
  const idElements = new Map();
  for (const element of document.querySelectorAll('[id]')) {
    const matches = idElements.get(element.id) ?? [];
    matches.push(element);
    idElements.set(element.id, matches);
  }
  const uniqueElement = (id) => {
    const matches = idElements.get(id);
    return matches?.length === 1 ? matches[0] : null;
  };

  const findings = [];
  for (const control of document.querySelectorAll(FORM_CONTROLS)) {
    // Only native, uniquely identified controls with one plain, explicit label are supported.
    if (!control.id || uniqueElement(control.id) !== control || control.labels?.length !== 1 ||
        control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby') ||
        control.hasAttribute('role') || control.closest(LIVE_REGIONS)) continue;
    const label = control.labels[0];
    if (label.htmlFor !== control.id || (label.id && uniqueElement(label.id) !== label)) continue;
    const labelText = plainCopyText(label);
    if (!labelText) continue;

    const descriptionIds = new Set((control.getAttribute('aria-describedby') ?? '').split(/\s+/u).filter(Boolean));
    for (const descriptionId of descriptionIds) {
      const description = uniqueElement(descriptionId);
      if (description === label) continue;
      const descriptionText = plainCopyText(description);
      // Preserve case, punctuation, units, and every non-whitespace character.
      if (descriptionText !== labelText) continue;
      findings.push({
        ruleId: 'copy/duplicate-linked-description',
        controlId: control.id,
        descriptionId,
        current: description.textContent,
        message: 'Linked description repeats the label. Review removal of this description and its ID reference; check other consumers first.',
      });
    }
  }
  return findings;
}
