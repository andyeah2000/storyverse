import React from 'react';
import LegalLayout, { LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
  {
    id: 'company-info',
    title: '1. Company Information',
    content: (
      <p>
        StoryVerse
        <br />
        [Your Name / Company Name]
        <br />
        [Street Address]
        <br />
        [Postal Code, City]
        <br />
        Germany
      </p>
    ),
  },
  {
    id: 'contact',
    title: '2. Contact',
    content: (
      <p>
        Email: contact@storyverse.app
        <br />
        Phone: [Phone Number]
      </p>
    ),
  },
  {
    id: 'vat-id',
    title: '3. VAT Identification Number',
    content: (
      <p>
        VAT ID according to § 27a of the German VAT Act:
        <br />
        [VAT ID]
      </p>
    ),
  },
  {
    id: 'responsible',
    title: '4. Responsible for Content',
    content: (
      <p>
        [Name]
        <br />
        [Address]
      </p>
    ),
  },
  {
    id: 'dispute-resolution',
    title: '5. EU Dispute Resolution',
    content: (
      <>
        <p>
          The European Commission provides a platform for online dispute resolution (ODR):{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>You can find our email address above in the legal notice.</p>
      </>
    ),
  },
  {
    id: 'consumer-disputes',
    title: '6. Consumer Dispute Resolution',
    content: (
      <p>
        We are not willing or obligated to participate in dispute resolution proceedings before a consumer arbitration board.
      </p>
    ),
  },
  {
    id: 'liability-content',
    title: '7. Liability for Content',
    content: (
      <>
        <p>
          As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Para. 1 TMG.
          However, according to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances
          that indicate illegal activity.
        </p>
        <p>
          Obligations to remove or block the use of information under general laws remain unaffected. However, liability in this regard is only possible
          from the point in time at which a concrete infringement of the law becomes known. If we become aware of any such infringements, we will remove
          this content immediately.
        </p>
      </>
    ),
  },
  {
    id: 'liability-links',
    title: '8. Liability for Links',
    content: (
      <p>
        Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability
        for these external contents. The respective provider or operator of the pages is always responsible for the content of the linked pages. A permanent
        content control of the linked pages is not reasonable without concrete evidence of an infringement. If we become aware of any infringements, we will
        remove such links immediately.
      </p>
    ),
  },
  {
    id: 'copyright',
    title: '9. Copyright',
    content: (
      <p>
        The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution, or
        any form of commercialization of such material beyond the scope of the copyright law requires the prior written consent of its respective author
        or creator. Downloads and copies of this site are only permitted for private, non-commercial use. If you become aware of any copyright infringement,
        please inform us accordingly. If we become aware of any infringements, we will remove such content immediately.
      </p>
    ),
  },
];

const Impressum: React.FC = () => {
  return (
    <LegalLayout
      title="Legal Notice (Impressum)"
      sections={sections}
      updatedAt={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      backLabel="Back to Home"
    />
  );
};

export default Impressum;
