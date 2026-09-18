"use client";

import { useEffect, useState } from "react";
import { Document, Image as PdfImage, Page, PDFDownloadLink, StyleSheet, Text, View } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { Certificate } from "./client";

const styles = StyleSheet.create({ page: { padding: 52, fontFamily: "Helvetica", color: "#14364b", border: "12 solid #d9f1e3" }, kicker: { fontSize: 11, letterSpacing: 2, color: "#008d61", textAlign: "center", marginBottom: 25 }, title: { fontSize: 29, textAlign: "center", marginBottom: 15 }, name: { fontSize: 32, textAlign: "center", color: "#007b55", marginVertical: 24 }, copy: { fontSize: 13, lineHeight: 1.65, textAlign: "center" }, footer: { marginTop: 35, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, qr: { width: 88, height: 88 }, code: { fontSize: 9, color: "#55707b", maxWidth: 250 } });

export function CertificateDownload({ certificate }: { certificate: Certificate }) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => { void QRCode.toDataURL(`${window.location.origin}/verify/${certificate.verification_code}`, { margin: 1, width: 240 }).then(setQr); }, [certificate.verification_code]);
  if (!qr) return <p role="status">Menyiapkan QR sertifikat…</p>;
  const document = <CertificateDocument certificate={certificate} qr={qr} />;
  return <PDFDownloadLink className="button secondary" document={document} fileName={`sertifikat-sinyal-${certificate.verification_code}.pdf`}>{({ loading }) => loading ? "Membuat PDF…" : "Unduh PDF"}</PDFDownloadLink>;
}

function CertificateDocument({ certificate, qr }: { certificate: Certificate; qr: string }) {
  const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(certificate.issued_at));
  return <Document title="Sertifikat Penyelesaian Pembelajaran Alfabet BISINDO"><Page size="A4" style={styles.page}><Text style={styles.kicker}>SINYAL · SERTIFIKAT PENYELESAIAN</Text><Text style={styles.title}>Pembelajaran Alfabet BISINDO</Text><Text style={styles.copy}>Diberikan kepada</Text><Text style={styles.name}>{certificate.recipient_name}</Text><Text style={styles.copy}>atas penyelesaian jalur belajar alfabet A–Z dan latihan ejaan nama di Sinyal. Sertifikat ini mencatat penyelesaian pembelajaran aplikasi, bukan sertifikasi kemahiran BISINDO.</Text><View style={styles.footer}><View><Text style={styles.copy}>{date}</Text><Text style={styles.code}>Kode verifikasi: {certificate.verification_code}</Text></View><PdfImage src={qr} style={styles.qr} /></View></Page></Document>;
}
