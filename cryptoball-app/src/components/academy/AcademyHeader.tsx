interface AcademyHeaderProps {
  playerCount: number;
}

const AcademyHeader = ({ playerCount }: AcademyHeaderProps) => (
  <section className="academy-section-header" aria-labelledby="academy-title">
    <div>
      <p className="academy-section-kicker">Recruitment</p>
      <h1 id="academy-title">Academy</h1>
      <p className="academy-section-copy">Scout fresh talent and sign the next CryptoBalls starter.</p>
    </div>
    <div className="academy-section-count">
      <strong>{playerCount}</strong>
      <span>available</span>
    </div>
  </section>
);

export default AcademyHeader;
