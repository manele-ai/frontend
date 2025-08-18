import '../styles/TermsAndConditionsPage.css';

const TermsAndConditionsPage = () => {
  return (
    <div 
      className="terms-conditions-wrapper"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="terms-conditions-container">
        <h1 className="terms-conditions-heading">Termeni de utilizare a aplicației manele.io</h1>
        <p className="terms-conditions-paragraph">Ultima actualizare: 14 august 2025</p>

        <p className="terms-conditions-paragraph">
          Aplicația manele.io este proprietatea SEACORTEX S.R.L., cu sediul social în Jud. Constanța, Municipiul Constanța, Aleea CAMELIEI, Nr. 2A, Bl. LE51, Scara A, Etaj 3, Ap. 11, înregistrată la Registrul Comerțului sub nr. J2025052653004, CUI 52169135, e-mail contact@manele.io („Furnizorul").
        </p>

        <p className="terms-conditions-paragraph">
          Prin accesarea sau utilizarea aplicației, denumită în continuare „Serviciul", inclusiv a site-ului, aplicației, interfețelor API și a altor funcționalități asociate, Utilizatorul declară că a citit, a înțeles și acceptă respectarea integrală a prezentelor Termeni și Condiții. În lipsa acordului, Serviciul nu poate fi furnizat.
        </p>

        <p className="terms-conditions-paragraph">
          Crearea unui cont sau utilizarea Serviciului este posibilă numai după exprimarea acordului expres față de Termeni, prin bifarea căsuței de acceptare afișate în interfața de înregistrare sau de acces („clickwrap agreement"). Fără exprimarea acestui acord explicit, accesul la Serviciu nu este permis. Bifarea căsuței are valoare juridică echivalentă cu semnătura și atestă că Utilizatorul a citit, a înțeles și a consimțit la toate prevederile prezentului document.
        </p>

        <h2 className="terms-conditions-heading">1. Definiții</h2>
        <p className="terms-conditions-paragraph">
          „Furnizorul" este entitatea care operează aplicația și deține drepturile asupra tehnologiei utilizate.
        </p>
        <p className="terms-conditions-paragraph">
          „Utilizatorul" este persoana fizică sau juridică ce accesează sau folosește Serviciul.
        </p>
        <p className="terms-conditions-paragraph">
          „Materialele Generate" reprezintă fișiere audio, MIDI, partituri, stem-uri, mostre sau alte rezultate create prin intermediul aplicației.
        </p>
        <p className="terms-conditions-paragraph">
          „Conținutul Utilizatorului" este orice prompt, fișier, text sau informație transmisă prin utilizarea Serviciului.
        </p>
        <p className="terms-conditions-paragraph">
          „Serviciul" desemnează ansamblul de funcționalități, resurse și conținut puse la dispoziția Utilizatorului de către Furnizor, prin intermediul aplicației manele.io, inclusiv, dar fără a se limita la, interfața grafică, modulele software, modelele de inteligență artificială, algoritmii de procesare, API-urile, elementele de design, bazele de date, conținutul audio și vizual generat sau furnizat, precum și orice actualizări, îmbunătățiri, extensii ori componente conexe, accesibile pe orice dispozitiv compatibil. Serviciul poate fi furnizat prin aplicații mobile, versiuni web, programe instalabile sau alte medii digitale controlate de Furnizor.
        </p>

        <h2 className="terms-conditions-heading">2. Licență și restricții asupra Materialelor Generate</h2>
        <p className="terms-conditions-paragraph">
          Furnizorul nu transferă niciun drept de proprietate intelectuală asupra Materialelor Generate. Utilizatorului i se acordă o licență neexclusivă, revocabilă, limitată, netransferabilă și fără drept de sublicențiere pentru utilizarea acestora exclusiv în scop personal și necomercial. Este interzisă monetizarea, distribuția în scop comercial, integrarea în produse sau servicii destinate vânzării, revendicarea paternității exclusive, sublicențierea, vânzarea, transferul, distribuirea către terți, folosirea în antrenarea altor modele de inteligență artificială sau orice formă de inginerie inversă a Serviciului.
        </p>

        <h2 className="terms-conditions-heading">3. Activități interzise</h2>
        <p className="terms-conditions-paragraph">
          Utilizatorului îi este interzis să utilizeze Serviciul, direct sau indirect, pentru desfășurarea de activități contrare legii, bunelor moravuri, drepturilor terților sau prezentelor Termeni și Condiții. Aceasta include, fără a se limita la:
        </p>
        <ul className="terms-conditions-list">
          <li>transmiterea de conținut protejat prin drepturi de autor, drepturi conexe, mărci, drepturi ale artiștilor interpreți sau executanți, design industrial ori alte drepturi de proprietate intelectuală ale terților, fără autorizația expresă și prealabilă a titularilor acestora;</li>
          <li>solicitarea de generare de rezultate care imită în mod confuz persoane reale sau artiști;</li>
          <li>folosirea Serviciului în scop de spam, phishing, distribuire de malware sau alte activități frauduloase ori dăunătoare;</li>
          <li>încărcarea, transmiterea sau punerea la dispoziție de fișiere ce conțin viruși, troieni, ransomware, macrocomenzi malițioase sau cod executabil neautorizat;</li>
          <li>încercarea de acces neautorizat la infrastructura Furnizorului, la conturile altor utilizatori ori la zone sau sisteme nepublice;</li>
          <li>testarea de penetrare sau scanarea de vulnerabilități fără consimțământ scris prealabil;</li>
          <li>ocolirea, dezactivarea sau alterarea măsurilor tehnice de protecție, inclusiv mecanisme de autentificare, limitări de rată, chei API, captchas, DRM, filigrane și marcatori de detecție;</li>
          <li>interferența cu funcționarea Serviciului, inclusiv prin atacuri de tip DoS/DDoS, flood, overload sau exploatarea bug-urilor;</li>
          <li>automatizarea accesului prin boți, scraping sau crawling neautorizat;</li>
          <li>partajarea credențialelor, utilizarea mai multor conturi pentru a eluda limitele sau restricțiile;</li>
          <li>revânzarea, sublicențierea ori furnizarea Serviciului către terți prin contul propriu;</li>
          <li>utilizarea de proxy-uri, VPN-uri sau alte mijloace pentru a ascunde identitatea în scop abuziv sau pentru a ocoli restricții geografice ori tehnice;</li>
          <li>decompilarea, dezasamblarea, interceptarea, monitorizarea sau capturarea traficului ori a comunicărilor interne ale Serviciului, cu excepția cazurilor permise în mod expres de lege și numai după notificare prealabilă către Furnizor.</li>
        </ul>
        <p className="terms-conditions-paragraph">
          Materialele încărcate în Serviciu trebuie să fie lipsite de viruși și componente malițioase, să nu includă chei de licență, parole, informații confidențiale ale terților ori conținut protejat fără drept. Responsabilitatea pentru verificarea și curățarea conținutului încărcat revine Utilizatorului.
        </p>
        <p className="terms-conditions-paragraph">
          Furnizorul își rezervă dreptul de a suspenda, restricționa sau închide accesul la Serviciu, fără notificare prealabilă, în cazul în care există indicii rezonabile privind desfășurarea unor astfel de activități și, dacă este necesar, de a informa autoritățile competente sau titularii de drepturi afectați.
        </p>

        <h2 className="terms-conditions-heading">4. Taxe</h2>
        <p className="terms-conditions-paragraph">
          Utilizatorul poate opta între a achita fiecare Material Generat în mod individual la prețul de bază afișat, sau de a achiziționa un abonament.
        </p>
        <p className="terms-conditions-paragraph">
          Abonamentul include 1 (un) Material Generat, 1(o) dedicație, precum și o reducere pentru toate Materialele Generate pe durata abonamentului.
        </p>
        <p className="terms-conditions-paragraph">
          Furnizorul poate modifica oricând prețul pentru Materialele Generate sau abonamente, noile valori urmând a fi afișate corespunzător pe pagina Serviciului.
        </p>
        <p className="terms-conditions-paragraph">
          Plata se face prin intermediul platformei Stripe, ai cărei termeni și condiții trebuie acceptate de Utilizator în mod distinct.
        </p>
        <p className="terms-conditions-paragraph">
          Toate taxele și plățile efectuate pentru accesul la Serviciu sau pentru utilizarea acestuia sunt definitive și nerambursabile. Achitarea oricărei sume către Furnizor reprezintă acceptul expres al Utilizatorului că nu va solicita rambursarea totală sau parțială a acesteia, indiferent de momentul sau motivul încetării accesului la Serviciu, inclusiv în situația de dezactivare, suspendare ori reziliere a contului ca urmare a încălcării Termenilor de utilizare.
        </p>

        <h2 className="terms-conditions-heading">5. Exonerarea de răspundere și limitarea răspunderii</h2>
        <p className="terms-conditions-paragraph">
          Serviciul este furnizat „așa cum este" și „în funcție de disponibilitate". Furnizorul nu garantează funcționarea continuă, fără erori sau întreruperi, securitatea absolută, originalitatea sau lipsa oricăror încălcări ale drepturilor terților. Furnizorul își rezervă dreptul de a modifica, suspenda sau întrerupe Serviciul, temporar sau definitiv, fără notificare prealabilă.
        </p>
        <p className="terms-conditions-paragraph">
          În măsura maximă permisă de lege, Furnizorul nu va fi răspunzător pentru pierderi de profit, venit, oportunități sau date, pentru daune indirecte, speciale, incidentale, punitive sau consecutive rezultate din utilizarea sau imposibilitatea de utilizare a Serviciului ori Materialelor Generate.
        </p>
        <p className="terms-conditions-paragraph">
          Furnizorul nu este în niciun fel răspunzător pentru Conținutul Utilizatorului ori Materialele Generate de Utilizatori.
        </p>
        <p className="terms-conditions-paragraph">
          Răspunderea totală, pentru orice cauze, a Furnizorului față de Utilizator este limitată la suma plătită pentru Serviciu în ultimele trei luni înaintea evenimentului cauzator de prejudiciu sau, dacă nu a fost efectuată nicio plată, la echivalentul a 50 EUR.
        </p>

        <h2 className="terms-conditions-heading">6. Proprietatea asupra Serviciului</h2>
        <p className="terms-conditions-paragraph">
          Toate componentele Serviciului, inclusiv codul sursă, designul, modelele de inteligență artificială și interfețele, rămân proprietatea exclusivă a Furnizorului. Nu se acordă niciun drept de proprietate sau de utilizare asupra acestora în afara licenței limitate prevăzute în prezentele Termeni.
        </p>

        <h2 className="terms-conditions-heading">7. Protecția datelor cu caracter personal</h2>
        <p className="terms-conditions-paragraph">
          Prelucrarea datelor cu caracter personal se face conform Politicii de Confidențialitate disponibile separat. Utilizatorii pot solicita ștergerea datelor conform legislației aplicabile.
        </p>

        <h2 className="terms-conditions-heading">8. Modificarea termenilor</h2>
        <p className="terms-conditions-paragraph">
          Termenii pot fi modificați periodic, iar versiunile actualizate vor fi publicate în cadrul aplicației sau pe site. Continuarea utilizării Serviciului după modificare constituie acceptarea acestora.
        </p>

        <h2 className="terms-conditions-heading">9. Legea aplicabilă și jurisdicția</h2>
        <p className="terms-conditions-paragraph">
          Prezentul document este guvernat de legislația română, iar eventualele litigii vor fi soluționate de instanțele competente din România. Datele de contact ale Furnizorului sunt disponibile în cadrul aplicației.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
