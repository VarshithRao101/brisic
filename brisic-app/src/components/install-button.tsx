"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useInstall, useIsInstalledApp } from "@/lib/install";

/** "Install" for the web app. Uses the browser prompt when offered, otherwise shows the manual steps. */
export function InstallButton() {
  const { canInstall, install } = useInstall();
  const installed = useIsInstalledApp();
  const [help, setHelp] = useState(false);

  if (installed) {
    return <p className="m-0 flex items-center gap-2 text-[15px] font-medium text-primary"><Icon name="check" size={18} /> Brisic is installed on this device.</p>;
  }
  return (
    <div>
      <button
        type="button" className="btn btn-primary"
        onClick={async () => {
          if (canInstall) await install();
          else setHelp(true);
        }}
      >
        <Icon name="download" size={18} /> Install Brisic
      </button>
      {help && !canInstall && (
        <ul className="m-0 mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[14px] font-light text-ink/90">
          <li><span className="font-medium text-white">Android (Chrome):</span> open the ⋮ menu, then tap “Add to Home screen” or “Install app”.</li>
          <li><span className="font-medium text-white">iPhone (Safari):</span> tap the Share button, then “Add to Home Screen”.</li>
          <li><span className="font-medium text-white">Computer (Chrome or Edge):</span> click the install icon at the right of the address bar.</li>
        </ul>
      )}
    </div>
  );
}
