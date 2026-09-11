import Link from "next/link";

export function LearningScreen({ eyebrow, title, description, back, children }: {
  eyebrow: string;
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="shell learning-screen">
      {back && <Link className="back-link" href={back.href}>← {back.label}</Link>}
      <div className="screen-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="screen-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}
