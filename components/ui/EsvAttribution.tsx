interface EsvAttributionProps {
  visible: boolean;
}

// Required wherever ESV® text is displayed, per Crossway's api.esv.org terms of use:
// the standard copyright notice plus a link back to esv.org.
export function EsvAttribution({ visible }: EsvAttributionProps) {
  if (!visible) return null;
  return (
    <p className="mx-auto w-full max-w-lg px-6 pb-4 text-center text-xs text-ink-muted">
      Scripture quotations are from The ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a
      publishing ministry of Good News Publishers. Used by permission. All rights reserved.{" "}
      <a href="https://www.esv.org" target="_blank" rel="noopener noreferrer" className="underline">
        www.esv.org
      </a>
    </p>
  );
}
