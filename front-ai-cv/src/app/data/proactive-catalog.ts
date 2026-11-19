export type OrganizationKind = 'Empresa' | 'Multinacional' | 'Organismo público';

export interface ProactiveOrganization {
  readonly name: string;
  readonly kind: OrganizationKind;
  /** Sitio institucional o de carreras, verificado al armar el catálogo. */
  readonly website: string;
}

export interface ProactiveSector {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly organizations: readonly ProactiveOrganization[];
}

/**
 * Catálogo orientativo: no es un listado de vacantes ni de contactos de RR.HH.
 * Sirve para elegir a quién querés enviar el CV. Si tu organización no está,
 * podés escribir el nombre manualmente.
 * Fuentes: argentina.gob.ar/organismos y sitios institucionales de cada empresa.
 */
export const PROACTIVE_SECTORS: readonly ProactiveSector[] = [
  {
    id: 'multinacionales',
    label: 'Multinacionales en Argentina',
    icon: 'bi-globe2',
    organizations: [
      {
        name: 'Coca-Cola Argentina',
        kind: 'Multinacional',
        website: 'https://www.coca-cola.com/ar/es'
      },
      {
        name: 'Coca-Cola Andina',
        kind: 'Multinacional',
        website: 'https://www.koandina.com'
      },
      { name: 'Unilever', kind: 'Multinacional', website: 'https://careers.unilever.com' },
      { name: 'PepsiCo', kind: 'Multinacional', website: 'https://www.pepsico.com' },
      { name: 'Mercado Libre', kind: 'Multinacional', website: 'https://www.mercadolibre.com' }
    ]
  },
  {
    id: 'tecnologia',
    label: 'Tecnología y software',
    icon: 'bi-cpu',
    organizations: [
      { name: 'Mercado Libre', kind: 'Empresa', website: 'https://www.mercadolibre.com' },
      { name: 'Globant', kind: 'Empresa', website: 'https://www.globant.com' },
      {
        name: 'Ministerio de Desregulación y Transformación del Estado',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/desregulacion'
      },
      { name: 'CONICET', kind: 'Organismo público', website: 'https://www.conicet.gov.ar' }
    ]
  },
  {
    id: 'economia',
    label: 'Economía, finanzas y contabilidad',
    icon: 'bi-bar-chart-line',
    organizations: [
      {
        name: 'Banco de la Nación Argentina',
        kind: 'Empresa',
        website: 'https://www.bna.com.ar'
      },
      {
        name: 'Banco Central de la República Argentina',
        kind: 'Organismo público',
        website: 'https://www.bcra.gob.ar'
      },
      {
        name: 'ARCA (Agencia de Recaudación y Control Aduanero)',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/arca'
      },
      {
        name: 'Ministerio de Economía',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/economia'
      }
    ]
  },
  {
    id: 'salud',
    label: 'Salud y ciencias',
    icon: 'bi-heart-pulse',
    organizations: [
      {
        name: 'Ministerio de Salud',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/salud'
      },
      {
        name: 'ANMAT',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/anmat'
      },
      { name: 'CONICET', kind: 'Organismo público', website: 'https://www.conicet.gov.ar' }
    ]
  },
  {
    id: 'educacion',
    label: 'Educación, ciencia y cultura',
    icon: 'bi-mortarboard',
    organizations: [
      {
        name: 'Ministerio de Capital Humano',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/capital-humano'
      },
      {
        name: 'Secretaría de Cultura',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/cultura'
      },
      { name: 'CONICET', kind: 'Organismo público', website: 'https://www.conicet.gov.ar' }
    ]
  },
  {
    id: 'industria',
    label: 'Industria y producción',
    icon: 'bi-gear',
    organizations: [
      { name: 'YPF', kind: 'Empresa', website: 'https://www.ypf.com' },
      { name: 'Techint', kind: 'Empresa', website: 'https://www.techint.com' },
      {
        name: 'Ministerio de Economía',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/economia'
      },
      {
        name: 'Coca-Cola Andina',
        kind: 'Multinacional',
        website: 'https://www.koandina.com'
      }
    ]
  },
  {
    id: 'administracion',
    label: 'Administración pública',
    icon: 'bi-bank',
    organizations: [
      {
        name: 'Jefatura de Gabinete de Ministros',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/jefatura'
      },
      {
        name: 'Ministerio del Interior',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/interior'
      },
      {
        name: 'Ministerio de Justicia',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/justicia'
      },
      {
        name: 'Ministerio de Defensa',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/defensa'
      },
      {
        name: 'Ministerio de Relaciones Exteriores, Comercio Internacional y Culto',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/cancilleria'
      },
      {
        name: 'Ministerio de Seguridad Nacional',
        kind: 'Organismo público',
        website: 'https://www.argentina.gob.ar/seguridad'
      },
      {
        name: 'Congreso de la Nación Argentina',
        kind: 'Organismo público',
        website: 'https://www.congreso.gob.ar'
      },
      {
        name: 'Ministerio Público Fiscal',
        kind: 'Organismo público',
        website: 'https://www.mpf.gob.ar'
      }
    ]
  }
];
