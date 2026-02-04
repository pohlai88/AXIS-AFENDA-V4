export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>Public Layout</header>
      {children}
    </div>
  );
}
