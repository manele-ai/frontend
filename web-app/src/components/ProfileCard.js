
/**
 * Responsive, self-contained credit card component for a profile page.
 *
 * How to use:
 * <ProfileCard
 *   subscribed={true}
 *   credits={123}
 *   maneleCount={45}
 *   dedicationsCount={67}
 *   money={890}
 *   profileName="DJ Costel"
 *   assets={{
 *     card: require("./_CARD.svg"),
 *     logo: require("./_LOGO_CARD.svg"),
 *     credite: require("./CREDITE.svg"),
 *     manele: require("./MANELE.svg"),
 *     dedicatii: require("./DEDICATII.svg"),
 *     bani: require("./BANI ARUNCATI.svg"),
 *   }}
 * />
 *
 * Notes:
 * - All overlay positions are set *relative to the card*, so everything stays in place responsively.
 * - Text sizes scale fluidly via CSS clamp().
 * - Move the <style> block into your app-level CSS if preferred; class names are prefixed with pc- to avoid clashes.
 */

export default function ProfileCard({
  subscribed = false,
  credits = 0,
  maneleCount = 0,
  dedicationsCount = 0,
  money = 0,
  profileName = "",
}) {
  return (
    <div className="pc-card-wrap">
      {/* Background card image */}
      <img className="pc-card-bg" src="/profile-card/CARD.svg" alt="credit card" />

      {/* Absolute overlay for all UI elements */}
      <div className="pc-overlay">
        {/* VIP badge (top-left) */}
        <div className="pc-vip">Manelist {subscribed ? 'VIP' : ''}</div>

        {/* Logo (top-right) */}
        <img className="pc-logo" src="/profile-card/LOGO_CARD.svg" alt="logo" draggable={false} />

        {/* Stats row (icons sit a bit below the vertical middle). Numbers above each icon */}
        <div className="pc-stats-row" aria-label="user stats on card">
          <div className="pc-stat">
            <div className="pc-stat-value" title="Credite">{formatNumber(credits)}</div>
            <img className="pc-stat-icon" src="/profile-card/CREDITE.svg" alt="CREDITE" draggable={false} />
          </div>

          <div className="pc-stat">
            <div className="pc-stat-value" title="Manele create">{formatNumber(maneleCount)}</div>
            <img className="pc-stat-icon" src="/profile-card/MANELE.svg" alt="MANELE" draggable={false} />
          </div>

          <div className="pc-stat">
            <div className="pc-stat-value" title="Dedicatii">{formatNumber(dedicationsCount)}</div>
            <img className="pc-stat-icon" src="/profile-card/DEDICATII.svg" alt="DEDICATII" draggable={false} />
          </div>

          <div className="pc-stat">
            <div className="pc-stat-value" title="Bani aruncati">{formatNumber(money)}</div>
            <img className="pc-stat-icon" src="/profile-card/BANI ARUNCATI.svg" alt="BANI ARUNCATI" draggable={false} />
          </div>
        </div>

        {/* Profile name (bottom-left area) */}
        <div className="pc-profile-name" title="Profile name">{profileName}</div>
      </div>

      {/* Component-scoped styles for quick drop-in. Move into your CSS if preferred. */}
      <style>{`
        .pc-card-wrap {
          position: relative;
          width: min(760px, 100%);
          /* Keep a stable aspect ratio so everything scales together. Adjust if your _CARD.svg is different. */
          aspect-ratio: 16 / 10;
          display: block;
          user-select: none;
        }

        .pc-card-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
        }

        .pc-overlay {
          position: absolute;
          inset: 0;
          /* Create a safe padding so content does not hit the rounded edges */
          padding: 4% 5%;
          display: block;
        }

        /* VIP tag top-left */
        .pc-vip {
          position: absolute;
          top: 5%;
          left: 5%;
          font-weight: 800;
          letter-spacing: 0.08em;
          font-size: clamp(12px, 2.2vw, 18px);
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          padding: 0.25em 0.6em;
          border-radius: 999px;
          backdrop-filter: blur(4px);
        }

        /* Logo top-right */
        .pc-logo {
          position: absolute;
          top: 5%;
          right: 5%;
          width: clamp(40px, 12%, 96px);
          height: auto;
        }

        /* Stats row: horizontally centered group of 4 columns */
        .pc-stats-row {
          position: absolute;
          left: 7%;
          right: 7%;
          /* Place the row a bit below the vertical middle of the card */
          top: 58%;
          transform: translateY(-50%);

          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
          gap: clamp(8px, 3vw, 24px);
        }

        .pc-stat {
          display: grid;
          justify-items: center;
          align-items: center;
          grid-template-rows: auto auto;
        }

        .pc-stat-value {
          font-weight: 800;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.35);
          font-size: clamp(14px, 2.4vw, 24px);
          line-height: 1.1;
          margin-bottom: 0.3em;
        }

        .pc-stat-icon {
          max-width: clamp(28px, 12vw, 72px);
          height: auto;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          object-fit: contain;
        }

        /* Profile name bottom-left area */
        .pc-profile-name {
          position: absolute;
          left: 5%;
          bottom: 6%;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.35);
          font-size: clamp(12px, 2vw, 20px);
          max-width: 70%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* High DPI niceties */
        @media (min-resolution: 2dppx) {
          .pc-stat-icon { image-rendering: -webkit-optimize-contrast; }
        }
      `}</style>
    </div>
  );
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n ?? 0);
  } catch {
    return String(n ?? 0);
  }
}
