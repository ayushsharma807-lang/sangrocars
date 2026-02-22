"use client";

import { useMemo, useState } from "react";

type UploadState = {
  idProof: File | null;
  addressProof: File | null;
  incomeProof: File | null;
  signedOrder: File | null;
};

const defaultState: UploadState = {
  idProof: null,
  addressProof: null,
  incomeProof: null,
  signedOrder: null,
};

export default function RemoteDocsManager() {
  const [files, setFiles] = useState<UploadState>(defaultState);

  const completion = useMemo(() => {
    const list = Object.values(files);
    const done = list.filter(Boolean).length;
    return Math.round((done / list.length) * 100);
  }, [files]);

  const setFile = (key: keyof UploadState, file: File | null) =>
    setFiles((prev) => ({ ...prev, [key]: file }));

  return (
    <div className="experience-card">
      <h3>Remote document management</h3>
      <p>Upload pre-delivery paperwork from home and finish pickup in one visit.</p>
      <div className="experience-builder__grid">
        <label>
          ID proof
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFile("idProof", event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Address proof
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFile("addressProof", event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Income proof
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFile("incomeProof", event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Signed buyer order
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFile("signedOrder", event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="experience-builder__summary">
        <p>
          Completion: <strong>{completion}%</strong>
        </p>
        <ul className="experience-list">
          <li>{files.idProof ? "ID proof uploaded" : "Upload ID proof"}</li>
          <li>{files.addressProof ? "Address proof uploaded" : "Upload address proof"}</li>
          <li>{files.incomeProof ? "Income proof uploaded" : "Upload income proof"}</li>
          <li>{files.signedOrder ? "Signed order uploaded" : "Upload signed buyer order"}</li>
        </ul>
      </div>
    </div>
  );
}
