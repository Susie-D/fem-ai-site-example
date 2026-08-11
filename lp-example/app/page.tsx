const plants = [
  {
    name: "Aspidistra elatior",
    common: "Cast iron plant",
    size: "17 cm pot · 55–70 cm tall",
    price: "£28",
    note: "Tolerates lower light and the occasional missed watering.",
  },
  {
    name: "Nephrolepis exaltata",
    common: "Boston fern",
    size: "15 cm pot · 35–45 cm wide",
    price: "£18",
    note: "Best in bright, indirect light with evenly moist compost.",
  },
  {
    name: "Philodendron hederaceum",
    common: "Heartleaf philodendron",
    size: "14 cm pot · trailing",
    price: "£16",
    note: "An easy shelf plant; let the top layer dry between drinks.",
  },
  {
    name: "Ficus elastica ‘Abidjan’",
    common: "Rubber plant",
    size: "19 cm pot · 80–95 cm tall",
    price: "£38",
    note: "Give it bright light and keep it away from cold draughts.",
  },
];

const hours = [
  ["Monday", "Closed"],
  ["Tuesday–Friday", "10am–6pm"],
  ["Saturday", "9.30am–6pm"],
  ["Sunday", "11am–4pm"],
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Fern and Clay, home">
          <span>Fern</span><i aria-hidden="true">&amp;</i><span>Clay</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#plants">Plants</a>
          <a href="#care">Plant care</a>
          <a href="#workshops">Workshops</a>
          <a href="#visit">Visit</a>
        </nav>
        <a className="header-visit" href="#visit">Plan your visit</a>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img src="/images/greenhouse-hero.jpg" alt="Leafy plants on old timber benches inside the Fern & Clay greenhouse" />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">Plant shop &amp; working greenhouse · Stoke Newington</p>
            <h1 id="hero-title">Plants raised with care, for homes around here.</h1>
            <p className="hero-intro">Houseplants, honest advice and hands-on workshops from our greenhouse just off Church Street.</p>
            <div className="hero-actions">
              <a className="button button-light" href="#plants">See what’s in</a>
              <a className="text-link text-link-light" href="#visit">Opening hours <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <p className="hero-note">Open today until 6pm</p>
        </section>

        <section className="intro section-pad" aria-labelledby="intro-title">
          <p className="eyebrow">In the greenhouse</p>
          <div>
            <h2 id="intro-title">A proper neighbourhood plant shop.</h2>
            <p>We grow, source and look after a changing collection of houseplants in our working greenhouse. Come in with a dark corner, a sunny sill or a plant that is struggling—we’ll help you choose what will actually work.</p>
          </div>
          <aside>
            <span className="brass-mark" aria-hidden="true">✦</span>
            <p><strong>Free pot check</strong><br />Bring in your plant and its pot. We’ll check the roots, compost and drainage while you wait.</p>
          </aside>
        </section>

        <section className="plants section-pad" id="plants" aria-labelledby="plants-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">On the benches this week</p>
              <h2 id="plants-title">Plants currently available</h2>
            </div>
            <p>Stock changes as plants are ready. Call before travelling if you need a particular size.</p>
          </div>
          <div className="plant-layout">
            <figure className="plant-photo image-frame">
              <img src="/images/plants-bench.jpg" alt="Aspidistra, fern, philodendron and rubber plants in terracotta pots on a greenhouse bench" />
              <figcaption>Greenhouse-grown and acclimatised to London homes.</figcaption>
            </figure>
            <ol className="plant-list">
              {plants.map((plant) => (
                <li key={plant.name}>
                  <div className="plant-name">
                    <h3>{plant.common}</h3>
                    <em>{plant.name}</em>
                  </div>
                  <p>{plant.size}</p>
                  <p className="plant-note">{plant.note}</p>
                  <strong>{plant.price}</strong>
                </li>
              ))}
            </ol>
          </div>
          <p className="stock-note">Prices include a plain nursery pot. Terracotta pots start at £6.</p>
        </section>

        <section className="care section-pad" id="care" aria-labelledby="care-title">
          <div className="care-lead">
            <p className="eyebrow">Practical plant care</p>
            <h2 id="care-title">Bring us the plant you’re worried about.</h2>
            <p>Yellow leaves, pests, roots escaping the pot—we’ll diagnose the likely problem and give you a short care plan you can follow at home.</p>
            <a className="button button-dark" href="mailto:hello@fernandclay.example?subject=Plant%20care%20question">Ask a plant-care question</a>
          </div>
          <div className="care-services">
            <article>
              <span>01</span>
              <h3>Five-minute advice</h3>
              <p>Free in the shop. Bring the plant or clear photographs of the whole plant, leaves, soil and pot.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Repotting</h3>
              <p>From £8 plus compost and pot. Drop off Tuesday to Thursday; most plants are ready the next day.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Home plant visit</h3>
              <p>£45 within N16 for a 45-minute visit, including placement, watering and pest advice.</p>
            </article>
          </div>
        </section>

        <section className="workshops section-pad" id="workshops" aria-labelledby="workshops-title">
          <div className="workshop-photo image-frame">
            <img src="/images/potting-workshop.jpg" alt="Neighbours repotting leafy plants together around an old timber table" />
          </div>
          <div className="workshop-copy">
            <p className="eyebrow">Small greenhouse workshops</p>
            <h2 id="workshops-title">Learn by doing, with no more than eight people.</h2>
            <div className="workshop-list">
              <article>
                <p>First Saturday · 10.30am–12pm</p>
                <h3>Repotting without the guesswork</h3>
                <p>Choose compost, read the roots and repot one of your own houseplants. All materials included.</p>
                <div><strong>£28</strong><a href="mailto:hello@fernandclay.example?subject=Repotting%20workshop">Ask for the next date <span aria-hidden="true">→</span></a></div>
              </article>
              <article>
                <p>Third Thursday · 6.30–8pm</p>
                <h3>Winter houseplant care</h3>
                <p>Adjust light and watering, spot common pests and help tropical plants through a London winter.</p>
                <div><strong>£24</strong><a href="mailto:hello@fernandclay.example?subject=Winter%20plant%20care%20workshop">Ask for the next date <span aria-hidden="true">→</span></a></div>
              </article>
            </div>
          </div>
        </section>

        <section className="delivery section-pad" aria-labelledby="delivery-title">
          <p className="eyebrow">Local delivery</p>
          <h2 id="delivery-title">From our bench to your doorstep.</h2>
          <p>We deliver to N16, N15, N4, E5 and E8 on Tuesdays and Saturdays. Delivery is £6, or free when you spend £45. Order by 3pm the day before; we’ll confirm a two-hour arrival window.</p>
          <a className="text-link" href="tel:+442079460832">Call 020 7946 0832 to order <span aria-hidden="true">→</span></a>
        </section>

        <section className="visit" id="visit" aria-labelledby="visit-title">
          <div className="visit-details section-pad">
            <p className="eyebrow">Come by</p>
            <h2 id="visit-title">Visit the shop &amp; greenhouse</h2>
            <address>
              <strong>Fern &amp; Clay</strong><br />42 Carysfort Road<br />Stoke Newington, London N16 9AL
            </address>
            <p className="travel">Six minutes on foot from Stoke Newington station. Step-free entrance; the greenhouse aisle narrows to 85cm in one place.</p>
            <div className="hours" aria-label="Opening hours">
              {hours.map(([day, time]) => <p key={day}><span>{day}</span><strong>{time}</strong></p>)}
            </div>
            <div className="contact-links">
              <a href="tel:+442079460832">020 7946 0832</a>
              <a href="mailto:hello@fernandclay.example">hello@fernandclay.example</a>
            </div>
            <p className="fine-print">The greenhouse closes 15 minutes before the shop. Assistance dogs are welcome.</p>
          </div>
          <figure className="shopfront">
            <img src="/images/shopfront.jpg" alt="Fern & Clay’s green timber shopfront with plants visible through misted windows" />
          </figure>
        </section>
      </main>

      <footer>
        <a className="wordmark wordmark-footer" href="#top"><span>Fern</span><i>&amp;</i><span>Clay</span></a>
        <p>Independent plants, practical advice and a working greenhouse in Stoke Newington.</p>
        <p>© 2026 Fern &amp; Clay</p>
      </footer>
    </>
  );
}
