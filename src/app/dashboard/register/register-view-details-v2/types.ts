import { SectionField } from '../constant/common-constants';

export type Section = { title: string; entries: SectionField[] };
export type ViewSection = { sections: Section[]; titleSection: SectionField[] };
