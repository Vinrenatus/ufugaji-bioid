import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getCattleById } from '../utils/database';
import './Certificate.css';

function Certificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cattle, setCattle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef(null);

  useEffect(() => {
    if (id) {
      const found = getCattleById(id);
      if (found) {
        setCattle(found);
      } else {
        navigate('/cattle');
      }
    }
  }, [id, navigate]);

  async function generatePDF() {
    if (!certificateRef.current || !cattle) return;

    setIsGenerating(true);

    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${cattle.certificateId}-${cattle.cowName}-certificate.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function printCertificate() {
    window.print();
  }

  if (!cattle) {
    return (
      <div className="certificate-page">
        <div className="container">
          <div className="loading-state">Loading certificate...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-page">
      <div className="container">
        <div className="page-header no-print">
          <Link to="/cattle" className="btn btn-secondary">← Back to Registry</Link>
          <h1>📜 Digital Title Deed</h1>
          <div className="header-actions">
            <button 
              onClick={generatePDF} 
              className="btn btn-primary"
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Generating...' : '📥 Download PDF'}
            </button>
            <button onClick={printCertificate} className="btn btn-secondary">
              🖨️ Print
            </button>
          </div>
        </div>

        <div className="certificate-info no-print">
          <p><strong>MVP 4:</strong> This Digital Title Deed serves as legal proof of ownership. 
          Download or print this certificate for your records. Each certificate has a unique ID 
          that can be verified in the national registry.</p>
        </div>

        {/* Certificate Template */}
        <div className="certificate-wrapper">
          <div 
            ref={certificateRef}
            className="certificate-template"
            id="certificate"
          >
            <div className="cert-border">
              <div className="cert-header">
                <div className="cert-logo">🇰🇪</div>
                <h1 className="cert-title">CERTIFICATE OF OWNERSHIP</h1>
                <p className="cert-subtitle">Livestock Biometric Identification System</p>
                <div className="cert-seal">
                  <div className="seal-inner">
                    <span className="seal-text">UFUGAJI</span>
                    <span className="seal-year">BIO-ID</span>
                  </div>
                </div>
              </div>

              <div className="cert-body">
                <div className="cert-section">
                  <div className="cert-label">Certificate ID</div>
                  <div className="cert-value cert-id">{cattle.certificateId}</div>
                </div>

                <div className="cert-section main-section">
                  <div className="cert-label">Cow Name</div>
                  <div className="cert-value cert-large">{cattle.cowName}</div>
                </div>

                <div className="cert-grid">
                  <div className="cert-section">
                    <div className="cert-label">Owner Name</div>
                    <div className="cert-value">{cattle.ownerName}</div>
                  </div>
                  <div className="cert-section">
                    <div className="cert-label">Breed</div>
                    <div className="cert-value">{cattle.breed}</div>
                  </div>
                </div>

                <div className="cert-grid">
                  <div className="cert-section">
                    <div className="cert-label">Location</div>
                    <div className="cert-value">{cattle.location}</div>
                  </div>
                  <div className="cert-section">
                    <div className="cert-label">Registration Date</div>
                    <div className="cert-value">{cattle.registrationDate}</div>
                  </div>
                </div>

                <div className="cert-grid">
                  <div className="cert-section">
                    <div className="cert-label">Age</div>
                    <div className="cert-value">{cattle.age || 'Not specified'}</div>
                  </div>
                  <div className="cert-section">
                    <div className="cert-label">Sex</div>
                    <div className="cert-value">{cattle.sex || 'Not specified'}</div>
                  </div>
                </div>

                {cattle.color && (
                  <div className="cert-section">
                    <div className="cert-label">Color/Markings</div>
                    <div className="cert-value">{cattle.color}</div>
                  </div>
                )}

                <div className="cert-biometric">
                  <div className="cert-label">Biometric ID Status</div>
                  <div className="biometric-status">
                    <span className="status-icon">✅</span>
                    <span>Muzzle Print Biometric Data Stored</span>
                  </div>
                  <div className="feature-vector-preview">
                    <span className="fv-label">Feature Vector:</span>
                    <span className="fv-data">
                      {cattle.featureVector 
                        ? cattle.featureVector.slice(0, 8).map(v => v.toFixed(2)).join(', ') + '...'
                        : 'Not available'}
                    </span>
                  </div>
                </div>

                <div className="cert-muzzle-placeholder">
                  <div className="muzzle-frame">
                    <div className="muzzle-icon">🐄</div>
                    <span className="muzzle-label">Muzzle Print Biometric</span>
                    <span className="muzzle-sub">Unique to this animal</span>
                  </div>
                </div>
              </div>

              <div className="cert-footer">
                <div className="cert-signature">
                  <div className="signature-line"></div>
                  <div className="signature-label">Authorized Signature</div>
                </div>
                <div className="cert-date">
                  <div className="date-display">{new Date().toLocaleDateString('en-KE', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                  <div className="date-label">Date Issued</div>
                </div>
              </div>

              <div className="cert-disclaimer">
                <p>
                  This certificate serves as proof of ownership under the Ufugaji-BioID Livestock 
                  Identification System. The biometric data (muzzle print) stored for this animal 
                  is unique and cannot be altered. For verification, contact the registry database.
                </p>
                <p className="disclaimer-warning">
                  ⚠️ Cattle rustling is a criminal offense. Report suspicious activities to authorities.
                </p>
              </div>

              <div className="cert-watermark">
                KSEF 2026
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-actions no-print">
          <Link to="/cattle" className="btn btn-secondary">
            ← Back to Registry
          </Link>
          <button 
            onClick={generatePDF} 
            className="btn btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generating PDF...' : '📥 Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Certificate;
