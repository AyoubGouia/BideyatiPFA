/**
 * BideyetiLogo
 * Reproduces the compact header logo from the visitor page design image:
 *   ┌─────────────────────┐
 *   │  بدايتي  (Arabic)   │
 *   │  BIDEYETI           │
 *   └─────────────────────┘
 * Light-blue rounded badge with the brand name in two scripts.
 */
export default function BideyetiLogo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #daeaf5 0%, #c2d9ed 100%)',
        border: '1.5px solid rgba(180,210,235,0.7)',
        borderRadius: '10px',
        padding: '5px 10px 4px',
        lineHeight: 1.15,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        userSelect: 'none',
      }}
    >
      {/* Arabic text — بدايتي */}
      <span
        style={{
          fontFamily: "'Poppins', 'Segoe UI', sans-serif",
          fontSize: '15px',
          fontWeight: 800,
          background: 'linear-gradient(90deg, #F47920 30%, #e05a00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          direction: 'rtl',
          letterSpacing: '0.02em',
        }}
      >
       بداياتي
      </span>

      {/* Latin subtitle */}
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '8px',
          fontWeight: 600,
          color: '#5a7a96',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: '1px',
        }}
      >
        BIDEYETI
      </span>
    </div>
  )
}
