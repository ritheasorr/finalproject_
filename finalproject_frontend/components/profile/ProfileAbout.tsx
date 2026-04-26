interface ProfileAboutProps {
  title?: string;
  about: string;
}

export default function ProfileAbout({ title = 'About', about }: ProfileAboutProps) {
  return (
    <div className="surface-card p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {about || 'No profile summary available yet.'}
      </p>
    </div>
  );
}
