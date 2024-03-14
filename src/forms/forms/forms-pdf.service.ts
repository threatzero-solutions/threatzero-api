import { Injectable } from '@nestjs/common';
import { FormSubmission } from './entities/form-submission.entity';
import { Form } from './entities/form.entity';
import FieldResponse from '../fields/entities/field-response.entity';
import sanitizeHtml from 'sanitize-html';
import PdfMake from 'pdfmake';
import {
  Content,
  ContentText,
  TDocumentDefinitions,
  CustomTableLayout,
  ContentImage,
} from 'pdfmake/interfaces';
import { FieldGroup } from '../field-groups/entities/field-group.entity';
import { ConfigService } from '@nestjs/config';

const PDF_TABLE_LAYOUTS: { [key: string]: CustomTableLayout } = {
  valueBox: {
    paddingTop: (i, node) => 7,
    paddingRight: (i, node) => 7,
    paddingBottom: (i, node) => 7,
    paddingLeft: (i, node) => 7,
    hLineColor: (i, node) => '#888',
    vLineColor: (i, node) => '#888',
    hLineWidth: (i, node) => 0.5,
    vLineWidth: (i, node) => 0.5,
  },
};

export interface FormPDFGenerateOptions {
  excludeLogo?: boolean;
  logoUrl?: string;
}

@Injectable()
export class FormsPdfService {
  constructor(private readonly config: ConfigService) {}

  async formSubmissionToPDF(
    form: Form,
    submission?: FormSubmission,
    options: FormPDFGenerateOptions = {},
  ) {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    return new PdfMake(fonts).createPdfKitDocument(
      await this.generatePDFDefinition(form, submission, options),
      {
        tableLayouts: PDF_TABLE_LAYOUTS,
      },
    );
  }

  async generatePDFDefinition(
    form: Form,
    submission?: FormSubmission,
    options: FormPDFGenerateOptions = {},
  ) {
    let fieldResponseMap: { [key: string]: FieldResponse } = {};
    if (submission) {
      fieldResponseMap = submission.fieldResponses.reduce(
        (acc, fieldResponse) => {
          acc[fieldResponse.field.id] = fieldResponse;
          return acc;
        },
        {} as Record<string, FieldResponse>,
      );
    }

    const pdfContent: Content = [];

    const tzLogoUrl =
      options.logoUrl || this.config.get<string>('general.threatzeroLogoUrl');
    if (!options.excludeLogo && tzLogoUrl) {
      pdfContent.push({
        image: tzLogoUrl,
        width: 200,
        margin: [0, 0, 0, 20],
        alignment: 'center',
      } as ContentImage);
    }

    interface NullableContentText extends Omit<ContentText, 'text'> {
      text?: string | null;
    }
    const _addIfExists = (c: NullableContentText) =>
      c.text && pdfContent.push(c as ContentText);

    const stripTags = (s: string) => sanitizeHtml(s, { allowedTags: [] });

    const _addLevel = (metadata: Form | FieldGroup, level = 0) => {
      const prefix = level === 0 ? 'form' : level === 1 ? 'group' : 'subgroup';
      _addIfExists({
        text: metadata.title && stripTags(metadata.title),
        style: `${prefix}_title`,
      });
      _addIfExists({
        text: metadata.subtitle && stripTags(metadata.subtitle),
        style: `${prefix}_subtitle`,
      });
      _addIfExists({
        text: metadata.description && stripTags(metadata.description),
        style: `${prefix}_description`,
      });

      for (const field of metadata.fields.sort(this.orderSort)) {
        pdfContent.push({
          text: stripTags(field.label),
          style: 'form_field_label',
        });
        _addIfExists({
          text: field.helpText && stripTags(field.helpText),
          style: 'form_field_helptext',
        });
        pdfContent.push({
          layout: 'valueBox',
          table: {
            widths: ['*'],
            body: [[fieldResponseMap[field.id]?.value ?? 'No response.']],
          },
          style: 'form_field_value',
        });
      }

      let childGroups: FieldGroup[] = [];
      if (Object.hasOwn(metadata, 'groups')) {
        childGroups = (metadata as Form).groups;
      } else if (Object.hasOwn(metadata, 'childGroups')) {
        childGroups = (metadata as FieldGroup).childGroups;
      }

      for (const group of childGroups.sort(this.orderSort)) {
        _addLevel(group, level + 1);
      }
    };

    _addLevel(form);

    const defs: TDocumentDefinitions = {
      content: pdfContent,
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9,
      },
      pageMargins: [40, 60],
      footer: (currentPage, pageCount) => ({
        columns: [
          {
            text: 'ThreatZero Solutions',
            alignment: 'center',
          },
          {
            text: '',
          },
          {
            text: `${currentPage} of ${pageCount}`,
            alignment: 'center',
          },
        ],
        style: 'footer',
        columnGap: 10,
      }),
      styles: {
        footer: {
          margin: [0, 20],
        },
        form_title: {
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 15],
          alignment: 'center',
        },
        form_subtitle: {
          fontSize: 12,
          margin: [0, -10, 0, 15],
          alignment: 'center',
        },
        form_description: {
          fontSize: 10,
          margin: [0, -10, 0, 15],
          alignment: 'center',
          color: '#444444',
        },
        group_title: {
          fontSize: 12,
          bold: true,
          margin: [0, 15],
        },
        group_subtitle: {
          fontSize: 11,
          margin: [0, -10, 0, 15],
        },
        group_description: {
          margin: [0, -10, 0, 15],
          color: '#444444',
        },
        subgroup_title: {
          bold: true,
          margin: [0, 15],
        },
        subgroup_subtitle: {
          margin: [0, -10, 0, 15],
        },
        subgroup_description: {
          margin: [0, -10, 0, 15],
          color: '#444444',
        },
        form_field_label: {
          bold: true,
          margin: [0, 10, 0, 5],
        },
        form_field_helptext: {
          margin: [0, 0, 0, 5],
          color: '#444444',
        },
        form_field_value: {
          margin: [0, 0, 0, 10],
          italics: true,
          color: '#0c4ca0',
        },
      },
    };

    return defs;
  }

  private orderSort(a: { order?: number }, b: { order?: number }) {
    return (a.order ?? 0) - (b.order ?? 0);
  }
}
