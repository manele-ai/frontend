import '../styles/PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div 
      className="privacy-policy-wrapper"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="privacy-policy-container">
        <h1 className="privacy-policy-heading">Politica de Confidențialitate</h1>
        <p className="privacy-policy-paragraph">Ultima actualizare: 12 august 2025</p>

        <p className="privacy-policy-paragraph">
          Prezenta Politică de Confidențialitate descrie modul în care SEACORTEX S.R.L., cu sediul social în Jud. Constanța, Municipiul Constanța, Aleea CAMELIEI, Nr. 2A, Bl. LE51, Scara A, Etaj 3, Ap. 11, înregistrată la Registrul Comerțului sub nr. J2025052653004, CUI 52169135, e-mail contact@manele.io („Operatorul") colectează, utilizează, stochează și protejează datele cu caracter personal ale utilizatorilor în legătură cu aplicația noastră de generare muzicală asistată de inteligență artificială manele.io („Serviciul"). Prin crearea unui cont sau utilizarea Serviciului, declarați că ați citit și înțeles această politică.
        </p>

        <p className="privacy-policy-paragraph">
          Plățile sunt gestionate prin intermediul platformei Stripe, care aplică propria politică de confidențialitate, pe care utilizatorii trebuie să o citească și să o accepte înainte de realizarea oricărei plăți.
        </p>

        <h2 className="privacy-policy-heading">1. Datele colectate</h2>
        <p className="privacy-policy-paragraph">
          Pentru a vă oferi acces la Serviciu, colectăm următoarele date cu caracter personal:
        </p>
        <ul className="privacy-policy-list">
          <li>Nume</li>
          <li>Prenume</li>
          <li>Adresă de e-mail</li>
          <li>Adresă IP</li>
        </ul>
        <p className="privacy-policy-paragraph">
          Nu colectăm alte categorii de date cu caracter personal decât dacă ne sunt furnizate voluntar de către dumneavoastră (ex. în cadrul comunicărilor cu echipa de suport).
        </p>

        <h2 className="privacy-policy-heading">2. Scopurile prelucrării</h2>
        <p className="privacy-policy-paragraph">
          Datele colectate sunt utilizate exclusiv pentru:
        </p>
        <ul className="privacy-policy-list">
          <li>Crearea și administrarea contului de utilizator;</li>
          <li>Furnizarea Serviciului, inclusiv autentificare, salvarea preferințelor și generarea de materiale muzicale;</li>
          <li>Gestionarea solicitărilor, întrebărilor și reclamațiilor transmise către echipa de suport clienți.</li>
        </ul>

        <h2 className="privacy-policy-heading">3. Temeiul legal al prelucrării</h2>
        <p className="privacy-policy-paragraph">
          Prelucrăm datele dumneavoastră în baza:
        </p>
        <ul className="privacy-policy-list">
          <li>Art. 6 alin. (1) lit. b din GDPR – prelucrarea este necesară pentru executarea unui contract (Termenii și Condițiile Serviciului);</li>
          <li>Art. 6 alin. (1) lit. f din GDPR – interesul nostru legitim de a menține și îmbunătăți funcționarea Serviciului și de a asigura asistență clienților.</li>
        </ul>

        <h2 className="privacy-policy-heading">4. Stocarea și durata păstrării</h2>
        <p className="privacy-policy-paragraph">
          Datele dumneavoastră sunt stocate în medii securizate și păstrate cât timp aveți un cont activ în cadrul Serviciului sau atât cât este necesar pentru respectarea obligațiilor legale. La expirarea unui termen de 3 ani de la data ultimei interacțiuni active a contului de utilizator, vom șterge sau anonimiza datele, cu excepția situațiilor în care păstrarea lor este impusă de lege.
        </p>

        <h2 className="privacy-policy-heading">5. Divulgarea datelor către terți</h2>
        <p className="privacy-policy-paragraph">
          Nu vindem și nu închiriem datele dumneavoastră personale. Putem transmite date către furnizori de servicii (ex. servicii de găzduire, e-mail) strict pentru funcționarea Serviciului, aceștia fiind obligați prin contract să respecte cerințele legale privind protecția datelor. Putem divulga datele dacă acest lucru este impus prin lege, hotărâre judecătorească sau solicitare a autorităților competente.
        </p>

        <h2 className="privacy-policy-heading">6. Securitatea datelor</h2>
        <p className="privacy-policy-paragraph">
          Luăm măsuri tehnice și organizatorice rezonabile pentru protejarea datelor împotriva accesului neautorizat, pierderii, distrugerii sau alterării. Totuși, niciun sistem informatic nu este complet securizat, iar transmiterea informațiilor prin internet presupune anumite riscuri.
        </p>

        <h2 className="privacy-policy-heading">7. Drepturile dumneavoastră</h2>
        <p className="privacy-policy-paragraph">
          Conform GDPR, aveți următoarele drepturi:
        </p>
        <ul className="privacy-policy-list">
          <li>dreptul de acces la datele personale;</li>
          <li>dreptul la rectificare;</li>
          <li>dreptul la ștergere („dreptul de a fi uitat");</li>
          <li>dreptul la restricționarea prelucrării;</li>
          <li>dreptul la portabilitatea datelor;</li>
          <li>dreptul de opoziție la prelucrare;</li>
          <li>dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.</li>
        </ul>
        <p className="privacy-policy-paragraph">
          Pentru exercitarea acestor drepturi, ne puteți contacta la adresa de e-mail menționată mai jos.
        </p>

        <h2 className="privacy-policy-heading">8. Modificări ale Politicii</h2>
        <p className="privacy-policy-paragraph">
          Ne rezervăm dreptul de a actualiza periodic această Politică de Confidențialitate. Orice modificări vor fi publicate în aplicație și pe site, cu data actualizării. Continuarea utilizării Serviciului după modificări constituie acceptarea acestora.
        </p>

        <h2 className="privacy-policy-heading">9. Cookies</h2>
        <p className="privacy-policy-paragraph">
          Cookie-urile sunt fișiere mici de tip text stocate pe dispozitivul dumneavoastră (computer, telefon mobil, tabletă) atunci când vizitați sau utilizați aplicația noastră. Acestea sunt folosite pentru a asigura funcționarea corectă a aplicației și pentru a colecta informații statistice anonime.
        </p>

        <h2 className="privacy-policy-heading">10. Tipuri de cookie-uri pe care le folosim</h2>
        <p className="privacy-policy-paragraph">
          Aplicația noastră utilizează următoarele tipuri de cookie-uri:
        </p>
        
        <h3 className="privacy-policy-subheading">a) Cookie-uri strict necesare</h3>
        <ul className="privacy-policy-list">
          <li>Aceste cookie-uri sunt esențiale pentru funcționarea corectă a aplicației.</li>
          <li>Permit navigarea în aplicație și utilizarea funcționalităților de bază.</li>
          <li>Nu pot fi dezactivate, deoarece fără ele aplicația nu ar funcționa corespunzător.</li>
          <li>Exemple: cookie-uri pentru autentificare, cookie-uri care rețin setările de confidențialitate.</li>
        </ul>

        <h3 className="privacy-policy-subheading">b) Cookie-uri de analiză (statistice)</h3>
        <ul className="privacy-policy-list">
          <li>Ne ajută să înțelegem cum este utilizată aplicația (de exemplu, paginile vizitate, durata sesiunilor, tipul dispozitivului utilizat).</li>
          <li>Informațiile colectate sunt agregate și anonime, nefiind folosite pentru identificarea directă a utilizatorilor.</li>
          <li>Utilizăm aceste date pentru a îmbunătăți funcționalitatea și experiența utilizatorilor.</li>
          <li>Aceste cookie-uri sunt plasate doar cu acordul dumneavoastră.</li>
        </ul>

        <h2 className="privacy-policy-heading">11. Ce cookie-uri nu folosim</h2>
        <p className="privacy-policy-paragraph">
          Nu utilizăm cookie-uri de marketing sau cookie-uri de targetare pentru publicitate personalizată.
        </p>

        <h2 className="privacy-policy-heading">12. Gestionarea preferințelor privind cookie-urile</h2>
        <ul className="privacy-policy-list">
          <li>La prima accesare a aplicației, vi se va solicita acordul pentru utilizarea cookie-urilor de analiză.</li>
          <li>Puteți modifica în orice moment preferințele din setările aplicației sau din setările browserului/dispozitivului.</li>
          <li>De asemenea, puteți șterge cookie-urile existente folosind setările browserului.</li>
        </ul>

        <h2 className="privacy-policy-heading">13. Contact</h2>
        <p className="privacy-policy-paragraph">
          Pentru întrebări sau solicitări privind datele dumneavoastră personale, ne puteți contacta la:
        </p>
        <p className="privacy-policy-paragraph">
          E-mail: <a href="mailto:contact@manele.io" className="privacy-policy-link">contact@manele.io</a><br />
          Adresă poștală: Jud. Constanța, Municipiul Constanța, Aleea CAMELIEI, Nr. 2A, Bl. LE51, Scara A, Etaj 3, Ap. 11
        </p>
        <p className="privacy-policy-paragraph">
          Dacă aveți întrebări despre utilizarea cookie-urilor, ne puteți contacta la: <a href="mailto:contact@manele.io" className="privacy-policy-link">contact@manele.io</a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
