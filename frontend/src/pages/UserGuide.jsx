import { useEffect, useRef } from 'react';

const README_HTML = `
<header>
    <h1>NWIS — Nearby Wells Intelligence System</h1>
    <div class="readme-subtitle">
        <strong>SIH26121 — eRTMAC-NWIS (Nearby Wells Intelligence System):</strong>
        An AI-Powered Offset Well Knowledge and Decision Support Platform for Drilling Operations
    </div>

    <h2>Prototype User Manual</h2>

    <div class="readme-note">
        <strong>Note:</strong>
        NWIS is currently a prototype developed for demonstration purposes.
        The interface and features are not a final design, and the application currently uses
        synthetic/demo data for testing and presentation.
    </div>
</header>

<nav class="readme-toc">
    <h2>Contents</h2>
    <ul>
        <li><a href="#about">About the Prototype</a></li>
        <li><a href="#dashboard">Dashboard</a></li>
        <li><a href="#proposed-location">Proposed Drilling Location</a></li>
        <li><a href="#nearby-wells">Nearby Wells</a></li>
        <li><a href="#well-intelligence">Well Intelligence</a></li>
        <li><a href="#live-monitor">Live Drilling Monitor</a></li>
        <li><a href="#geological-correlation">Geological Correlation</a></li>
        <li><a href="#historical-events">Historical Events</a></li>
        <li><a href="#documents">Documents</a></li>
        <li><a href="#evidence-viewer">Evidence Viewer</a></li>
    </ul>
</nav>

<section id="about">
    <h2>1. About the Prototype</h2>
    <p>
        NWIS (Nearby Wells Intelligence System) is a prototype developed for
        <strong>SIH Problem Statement SIH26121</strong>.
    </p>
    <p>
        The purpose of the system is to bring together information from
        <strong>nearby wells, historical drilling events, geological formations,
        drilling reports, and current drilling parameters</strong> so that users
        can identify historical patterns and investigate possible drilling risks.
    </p>
    <p>
        Instead of looking at each source of information separately, NWIS connects
        them into a single workflow:
    </p>
    <pre class="readme-flow">Nearby Wells
      ↓
Historical Well Data
      ↓
Geological Formations
      ↓
Historical Drilling Events
      ↓
Source Documents
      ↓
Geological Correlation
      ↓
Current Drilling Parameters
      ↓
Risk Identification
      ↓
Supporting Evidence</pre>
</section>

<section id="dashboard">
    <h2>Dashboard</h2>
    <p>
        The Dashboard is the main screen of NWIS. It gives the user a quick overview
        of the current drilling and system status.
    </p>
    <p>
        The dashboard shows important information such as the
        <strong>Active Well, Current Depth, Simulator Status, and Total Wells</strong>.
        This helps the user understand the current state of the system at a glance.
    </p>
    <p>
        The <strong>Recent Risk Alerts</strong> section shows the latest alerts generated
        by the system, while <strong>Recent Historical Events</strong> shows important
        past drilling events with details such as the well, event type, depth, and severity.
    </p>
    <p>
        The top navigation provides access to different sections of NWIS, such as
        <strong>Overview, Wells, Alerts, and Services</strong>. The status indicators
        also show whether the main system services are running properly.
    </p>
    <p>
        The Dashboard is mainly used as a <strong>quick overview and monitoring screen</strong>
        before moving to a specific section of the application.
    </p>
    <div class="readme-image">
        <img src="/Readme/Dashboard.png" alt="NWIS Dashboard">
        <div class="readme-caption">NWIS Dashboard</div>
    </div>
</section>

<section id="proposed-location">
    <h2>Proposed Drilling Location</h2>
    <p>
        The <strong>Proposed Drilling Location</strong> section is used to evaluate
        a new drilling location before starting drilling operations. It helps the user
        understand the nearby wells, possible risks, and supporting historical evidence
        for the selected area.
    </p>
    <p>
        The <strong>Select Location</strong> step displays the proposed location on the
        map along with nearby wells within the selected area. The user can visually
        understand the location and its surrounding drilling activity.
    </p>
    <p>
        The <strong>AI Risk Assessment</strong> provides an overall risk level and
        highlights the main identified risk. In this example, the system identifies
        <strong>Stuck Pipe</strong> as the primary risk based on historical incidents
        from nearby wells.
    </p>
    <p>
        The <strong>AI Reasoning</strong> section explains why the risk was identified
        by comparing the proposed depth with historical well incidents. The
        <strong>Supporting Evidence</strong> section provides related drilling reports
        that can be opened to verify the information.
    </p>
    <p>
        This section helps the user make an
        <strong>evidence-based assessment of a proposed drilling location</strong>
        before proceeding with drilling.
    </p>
    <div class="readme-image">
        <img src="/Readme/Select_Location.png" alt="Proposed Drilling Location and AI Risk Assessment">
        <div class="readme-caption">Proposed Drilling Location and AI Risk Assessment</div>
    </div>
</section>

<section id="nearby-wells">
    <h2>Nearby Wells</h2>
    <p>
        The <strong>Nearby Wells</strong> section helps the user find and review wells
        located around a selected drilling location. The wells are displayed on the map
        based on the chosen search radius.
    </p>
    <p>
        The user can adjust the <strong>search radius</strong> and filter the results by
        <strong>formation</strong> or <strong>incident type</strong>. The system then
        shows the number of wells found within the selected area.
    </p>
    <p>
        Selecting a well displays important information such as its
        <strong>distance, status, total depth, and number of incidents</strong>.
        The section also provides access to related <strong>legacy documents</strong>
        and recorded drilling incidents.
    </p>
    <p>
        Each incident includes details such as the
        <strong>incident type, depth, severity, and a short description</strong>.
        This allows the user to quickly understand the drilling history of nearby wells
        and identify relevant events.
    </p>
    <div class="readme-image">
        <img src="/Readme/Nearby_Wells.png" alt="NWIS Nearby Wells section">
        <div class="readme-caption">NWIS Nearby Wells section</div>
    </div>
</section>

<section id="well-intelligence">
    <h2>Well Intelligence</h2>
    <p>
        The <strong>Well Intelligence</strong> section provides detailed information
        about a selected well. It helps the user understand the well's current status,
        location, depth, and other important details.
    </p>
    <p>
        The <strong>Details</strong> tab displays basic well information such as the
        <strong>well name, status, type, operator, field, total depth, current depth,
        coordinates, and drilling dates</strong>.
    </p>
    <p>
        The <strong>Formations</strong> tab can be used to view the geological formations
        associated with the well, while the <strong>Incidents</strong> tab provides
        information about recorded drilling incidents.
    </p>
    <p>
        The user can also <strong>view the well on the Nearby Wells map</strong> or use
        <strong>Analyze This Location</strong> to further examine the selected well
        and its surrounding information.
    </p>
    <div class="readme-image">
        <img src="/Readme/Well_Intelligence.png" alt="NWIS Well Intelligence section">
        <div class="readme-caption">NWIS Well Intelligence section</div>
    </div>
</section>

<section id="live-monitor">
    <h2>Live Drilling Monitor</h2>
    <p>
        The <strong>Live Drilling Monitor</strong> is used to observe drilling activity
        in real time through simulated drilling data. It focuses on the selected well
        and shows its current drilling status.
    </p>
    <p>
        The <strong>Gauges</strong> tab displays important drilling parameters such as
        <strong>Depth, Torque, RPM, Pump Pressure, Mud Weight, and Rate of Penetration (ROP)</strong>.
        These values help the user monitor changing drilling conditions.
    </p>
    <p>
        The <strong>Charts</strong> tab provides a visual view of the drilling parameters
        over time, while the <strong>Alerts</strong> tab shows risk alerts generated
        during the drilling process.
    </p>
    <p>
        The <strong>Start Simulation</strong> option begins the simulated drilling process.
        As the depth increases, the system monitors the drilling conditions and compares
        them with historical risk information to identify possible problems.
    </p>
    <div class="readme-image">
        <img src="/Readme/Live_Drilling.png" alt="NWIS Live Drilling Monitor">
        <div class="readme-caption">NWIS Live Drilling Monitor</div>
    </div>
</section>

<section id="geological-correlation">
    <h2>Geological Correlation</h2>
    <p>
        The <strong>Geological Correlation</strong> section is used to compare the active
        well with nearby wells and identify similarities in their geological information.
    </p>
    <p>
        In the <strong>Select Wells</strong> tab, the user can choose nearby wells for
        comparison. The list shows details such as <strong>distance, status, total depth,
        number of incidents, and field</strong> for each well.
    </p>
    <p>
        The user can select the required wells and run the correlation. The other tabs,
        <strong>Correlation, Formations, and Parameters</strong>, provide the results
        and additional information used for comparing the selected wells.
    </p>
    <p>
        This section helps the user understand how the
        <strong>active well relates to nearby wells</strong> and supports geological
        analysis using existing well information.
    </p>
    <div class="readme-image">
        <img src="/Readme/Geo_Correlation.png" alt="NWIS Geological Correlation section">
        <div class="readme-caption">NWIS Geological Correlation section</div>
    </div>
</section>

<section id="historical-events">
    <h2>Historical Events</h2>
    <p>
        The <strong>Historical Events</strong> section allows the user to browse and
        review past drilling incidents recorded in the system. It provides a consolidated
        view of events from different wells and formations.
    </p>
    <p>
        The user can filter events by <strong>formation, event type, and severity</strong>
        to quickly find specific incidents. The <strong>Search</strong> option can also
        be used to locate relevant historical records.
    </p>
    <p>
        Each event shows details such as the
        <strong>well, incident type, formation, depth, severity, and description</strong>.
        Expanding an event provides additional information, including drilling conditions,
        mitigation actions, and lessons learned.
    </p>
    <p>
        The user can also <strong>view the related well or locate it on the map</strong>.
        This helps in understanding previous drilling problems and using historical
        experience for future analysis.
    </p>
    <div class="readme-image">
        <img src="/Readme/Historical_Events.png" alt="NWIS Historical Events section">
        <div class="readme-caption">NWIS Historical Events section</div>
    </div>
</section>

<section id="documents">
    <h2>Documents</h2>
    <p>
        The <strong>Documents</strong> section provides access to the drilling and
        well-related documents available in NWIS. These documents contain supporting
        information collected from previous drilling activities.
    </p>
    <p>
        The document list shows details such as the
        <strong>document name, type, status, number of pages, recorded events, source,
        and date</strong>. This helps the user quickly identify the relevant document.
    </p>
    <p>
        The user can <strong>view the PDF</strong> to read the complete report or use
        the available actions to further inspect the document and its related information.
        The <strong>Upload</strong> tab can also be used to add documents to the system.
    </p>
    <p>
        These documents are useful as a source of
        <strong>historical evidence</strong> for analysing wells, incidents, and drilling
        risks within NWIS.
    </p>
    <div class="readme-image">
        <img src="/Readme/Documents.png" alt="NWIS Documents section">
        <div class="readme-caption">NWIS Documents section</div>
    </div>
</section>

<section id="evidence-viewer">
    <h2>Evidence Viewer</h2>
    <p>
        The <strong>Evidence Viewer</strong> section is used to review supporting evidence
        related to risk alerts generated by the system.
    </p>
    <p>
        The left panel lists the available <strong>Risk Alerts</strong>. When an alert
        is selected, the corresponding evidence is displayed in the main panel for
        further review.
    </p>
    <p>
        In the current view, there are no risk alerts available because the
        <strong>Live Drilling telemetry simulator has not been started yet</strong>.
        Once alerts are generated during drilling, they can be selected here to examine
        their supporting evidence.
    </p>
    <p>
        This section helps the user <strong>verify the information behind a detected risk</strong>
        instead of relying only on the alert itself.
    </p>
    <div class="readme-image">
        <img src="/Readme/Evidence_Viewer.png" alt="NWIS Evidence Viewer">
        <div class="readme-caption">NWIS Evidence Viewer</div>
    </div>
</section>

<footer class="readme-footer">
    <p>
        NWIS — Nearby Wells Intelligence System &nbsp;|&nbsp;
        SIH26121 &nbsp;|&nbsp; Prototype User Manual
    </p>
</footer>
`;

export default function UserGuideModal({ onClose }) {
  const containerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Handle anchor clicks for smooth scrolling within the modal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        const id = anchor.getAttribute('href').slice(1);
        const target = container.querySelector(`#${id}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal header with Go Back */}
        <div className="guide-modal-header">
          <h2>📖 User Guide</h2>
          <button className="guide-back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 14, height: 14 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Scrollable readme content */}
        <div className="guide-modal-body" ref={containerRef}>
          <div dangerouslySetInnerHTML={{ __html: README_HTML }} />
        </div>
      </div>
    </div>
  );
}
