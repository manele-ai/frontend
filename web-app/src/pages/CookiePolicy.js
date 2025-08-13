import './CookiePolicy.css';

const CookiePolicy = () => {
  return (
    <div className="cookie-policy-wrapper">
      <div className="cookie-policy-container">
        <h1 className="cookie-policy-heading">Politica de Confidențialitate și Cookie-uri</h1>
        <p className="cookie-policy-paragraph">Ultima actualizare: 12.08.2025</p>

        <h2 className="cookie-policy-heading">1. Introducere</h2>
        <p className="cookie-policy-paragraph">
          Această Politică de Cookie-uri explică modul în care folosim cookie-urile și tehnologiile similare de urmărire pe website-ul nostru. 
          Această politică vă ajută să înțelegeți ce informații colectăm folosind cookie-uri, cum folosim aceste informații și ce opțiuni aveți în privința utilizării cookie-urilor.
        </p>

        <h2 className="cookie-policy-heading">2. Ce Sunt Cookie-urile?</h2>
        <p className="cookie-policy-paragraph">
          Cookie-urile sunt fișiere text mici care sunt stocate pe dispozitivul dumneavoastră (computer, smartphone sau tabletă) când vizitați website-ul nostru. 
          Acestea ne ajută să vă recunoaștem dispozitivul și să vă oferim o experiență de navigare mai bună.
        </p>

        <h2 className="cookie-policy-heading">3. Tipuri de Cookie-uri Pe Care Le Folosim</h2>
        
        <h3 className="cookie-policy-subheading">3.1 Cookie-uri Necesare (Întotdeauna Active)</h3>
        <p className="cookie-policy-paragraph">
          Aceste cookie-uri sunt esențiale pentru funcționarea corectă a website-ului. Ele permit funcții de bază precum navigarea în pagină, 
          accesul la zonele securizate ale website-ului și memorarea preferințelor privind cookie-urile. Website-ul nu poate funcționa corespunzător fără aceste cookie-uri.
        </p>
        <ul className="cookie-policy-list">
          <li>Gestionarea sesiunilor</li>
          <li>Funcții de securitate</li>
          <li>Funcționalitate de bază</li>
        </ul>

        <h3 className="cookie-policy-subheading">3.2 Cookie-uri de Analiză (Opționale)</h3>
        <p className="cookie-policy-paragraph">
          Aceste cookie-uri ne ajută să înțelegem cum interacționează vizitatorii cu website-ul nostru prin colectarea și raportarea informațiilor în mod anonim. 
          Acest lucru ne ajută să îmbunătățim funcționalitatea și experiența utilizatorilor pe website.
        </p>
        <ul className="cookie-policy-list">
          <li>Înțelegerea paginilor cele mai populare</li>
          <li>Identificarea modului în care utilizatorii navighează pe site</li>
          <li>Detectarea și diagnosticarea problemelor tehnice</li>
          <li>Analiza performanței site-ului</li>
        </ul>

        <h2 className="cookie-policy-heading">4. Servicii Terțe</h2>
        <p className="cookie-policy-paragraph">
          Folosim servicii de analiză de încredere pentru a înțelege cum este utilizat website-ul nostru. 
          Aceste servicii pot plasa cookie-uri pe dispozitivul dumneavoastră. Ele procesează datele în mod anonim și nu identifică utilizatorii individuali.
        </p>

        <h2 className="cookie-policy-heading">5. Durata Cookie-urilor</h2>
        <p className="cookie-policy-paragraph">
          Cookie-urile pe care le folosim pot fi:
        </p>
        <ul className="cookie-policy-list">
          <li><strong className="cookie-policy-strong">Cookie-uri de Sesiune:</strong> Acestea sunt temporare și sunt șterse când închideți browserul</li>
          <li><strong className="cookie-policy-strong">Cookie-uri Persistente:</strong> Acestea rămân pe dispozitivul dumneavoastră pentru o perioadă determinată sau până când le ștergeți manual</li>
        </ul>

        <h2 className="cookie-policy-heading">6. Opțiunile Dumneavoastră Privind Cookie-urile</h2>
        <p className="cookie-policy-paragraph">
          Aveți dreptul să alegeți dacă acceptați sau refuzați cookie-urile. Puteți:
        </p>
        <ul className="cookie-policy-list">
          <li>Accepta toate cookie-urile</li>
          <li>Accepta doar cookie-urile necesare</li>
          <li>Modifica setările browserului pentru a refuza toate cookie-urile</li>
          <li>Șterge cookie-urile existente prin setările browserului</li>
        </ul>
        <p className="cookie-policy-paragraph">
          Vă rugăm să rețineți că dacă alegeți să refuzați cookie-urile necesare, este posibil ca unele funcționalități ale website-ului să nu funcționeze corespunzător.
        </p>

        <h2 className="cookie-policy-heading">7. Cum să Controlați Cookie-urile</h2>
        <p className="cookie-policy-paragraph">
          Majoritatea browserelor web vă permit să controlați cookie-urile prin setările lor. 
          Pentru a afla mai multe despre cookie-uri, inclusiv cum să vedeți ce cookie-uri au fost setate și cum să le gestionați și ștergeți, vizitați:
        </p>
        <ul className="cookie-policy-list">
          <li>Chrome: Setări {'->'} Confidențialitate și securitate {'->'} Cookie-uri</li>
          <li>Firefox: Setări {'->'} Confidențialitate și Securitate</li>
          <li>Safari: Preferințe {'->'} Confidențialitate</li>
          <li>Edge: Setări {'->'} Confidențialitate și securitate</li>
        </ul>

        <h2 className="cookie-policy-heading">8. Actualizări ale Acestei Politici</h2>
        <p className="cookie-policy-paragraph">
          Este posibil să actualizăm această Politică de Cookie-uri periodic pentru a reflecta modificări în practicile noastre sau din motive operaționale, legale sau de reglementare. 
          Data din partea de sus a acestei politici indică ultima actualizare.
        </p>

        <h2 className="cookie-policy-heading">9. Contact</h2>
        <p className="cookie-policy-paragraph">
          Dacă aveți întrebări despre utilizarea cookie-urilor de către noi, vă rugăm să ne contactați la{' '}
          <a href="mailto:contact@manele.io" className="cookie-policy-link">contact@manele.io</a>.
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy; 