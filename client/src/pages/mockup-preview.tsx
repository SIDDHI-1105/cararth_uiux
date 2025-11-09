import desktopDay from "@assets/generated_images/Desktop_day_glassmorphism_CarArth_57bc578d.png";
import desktopNight from "@assets/generated_images/Desktop_night_glassmorphism_CarArth_50fd3b22.png";
import mobileDay from "@assets/generated_images/Mobile_day_glassmorphism_CarArth_431fb674.png";
import mobileNight from "@assets/generated_images/Mobile_night_glassmorphism_CarArth_f1b870cc.png";

export default function MockupPreview() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a1a', 
      color: '#fff',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '40px',
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #FF6B35, #f39c12)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🚗 CarArth Glassmorphism Theme Preview
        </h1>

        {/* Desktop Views */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '2rem',
            color: '#f39c12'
          }}>
            Desktop Views
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
            gap: '40px'
          }}>
            <div style={{
              background: '#2a2a2a',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#FF6B35', fontSize: '1.5rem' }}>
                ☀️ Day Mode <span style={{
                  display: 'inline-block',
                  background: '#FF6B35',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  marginLeft: '10px'
                }}>Desktop</span>
              </h3>
              <img 
                src={desktopDay} 
                alt="Desktop Day Mode"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              />
              <p style={{ marginTop: '15px', color: '#aaa', lineHeight: '1.6' }}>
                Bright highway background with white frosted glass panels. Semi-transparent cards showing car listings with orange accent buttons.
              </p>
            </div>

            <div style={{
              background: '#2a2a2a',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#FF6B35', fontSize: '1.5rem' }}>
                🌙 Night Mode <span style={{
                  display: 'inline-block',
                  background: '#FF6B35',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  marginLeft: '10px'
                }}>Desktop</span>
              </h3>
              <img 
                src={desktopNight} 
                alt="Desktop Night Mode"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              />
              <p style={{ marginTop: '15px', color: '#aaa', lineHeight: '1.6' }}>
                Dark highway with city lights. Charcoal glass panels with glowing orange accents for premium nighttime experience.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Views */}
        <div>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '2rem',
            color: '#f39c12'
          }}>
            Mobile Views
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
            gap: '40px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              background: '#2a2a2a',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#FF6B35', fontSize: '1.5rem' }}>
                ☀️ Day Mode <span style={{
                  display: 'inline-block',
                  background: '#FF6B35',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  marginLeft: '10px'
                }}>Mobile</span>
              </h3>
              <img 
                src={mobileDay} 
                alt="Mobile Day Mode"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              />
              <p style={{ marginTop: '15px', color: '#aaa', lineHeight: '1.6' }}>
                Vertical single-column layout with white frosted glass cards stacked. Compact header with sun icon toggle.
              </p>
            </div>

            <div style={{
              background: '#2a2a2a',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#FF6B35', fontSize: '1.5rem' }}>
                🌙 Night Mode <span style={{
                  display: 'inline-block',
                  background: '#FF6B35',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  marginLeft: '10px'
                }}>Mobile</span>
              </h3>
              <img 
                src={mobileNight} 
                alt="Mobile Night Mode"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              />
              <p style={{ marginTop: '15px', color: '#aaa', lineHeight: '1.6' }}>
                Dark glass cards in vertical layout with glowing orange buttons. Premium mobile nighttime interface.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '30px',
          background: '#2a2a2a',
          borderRadius: '16px'
        }}>
          <h3 style={{ color: '#FF6B35', marginBottom: '15px' }}>Ready to implement?</h3>
          <p style={{ color: '#aaa', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            This glassmorphism theme will be applied to your existing React app while preserving all functionality. 
            All features, database operations, and authentication will remain intact—just with a beautiful new visual layer.
          </p>
        </div>
      </div>
    </div>
  );
}
