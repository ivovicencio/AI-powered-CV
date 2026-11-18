import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle
} from 'docx';
// @ts-ignore pdfkit is available at runtime, but its type declarations may be missing.
import PDFDocument from 'pdfkit';
import { AdaptedCv } from '../interfaces/cv.interface';

const createSectionHeadingDocx = (title: string): Paragraph => {
    return new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        border: {
            bottom: {
                color: '2B547E',
                space: 4,
                style: BorderStyle.SINGLE,
                size: 8
            }
        }
    });
};

export const cvGeneratorService = {
    generateDocx: async (cvData: AdaptedCv): Promise<Buffer> => {
        const children: Paragraph[] = [];

        // Encabezado Personal
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: cvData.personalInfo.fullName,
                        bold: true,
                        size: 32,
                        color: '1B365D'
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [
                    new TextRun({
                        text: cvData.personalInfo.targetRoleTitle,
                        bold: true,
                        size: 22,
                        color: '2B547E'
                    })
                ]
            })
        );

        const contactParts = [
            cvData.personalInfo.location,
            cvData.personalInfo.phone,
            cvData.personalInfo.email,
            cvData.personalInfo.linkedin,
            cvData.personalInfo.github,
            cvData.personalInfo.portfolio
        ].filter(Boolean);

        if (contactParts.length > 0) {
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: contactParts.join('  |  '),
                            size: 18,
                            color: '555555'
                        })
                    ]
                })
            );
        }

        // Resumen Profesional
        if (cvData.professionalSummary) {
            children.push(
                createSectionHeadingDocx('Perfil Profesional'),
                new Paragraph({
                    spacing: { after: 140 },
                    children: [new TextRun({ text: cvData.professionalSummary, size: 21 })]
                })
            );
        }

        // Habilidades relevantes para el puesto, de cualquier sector.
        if (cvData.keySkills && cvData.keySkills.length > 0) {
            children.push(createSectionHeadingDocx('Habilidades clave'));
            for (const group of cvData.keySkills) {
                children.push(
                    new Paragraph({
                        spacing: { after: 60 },
                        children: [
                            new TextRun({ text: `${group.category}: `, bold: true, size: 20 }),
                            new TextRun({ text: group.skills.join(', '), size: 20 })
                        ]
                    })
                );
            }
        }

        // Experiencia Laboral
        if (cvData.workExperience && cvData.workExperience.length > 0) {
            children.push(createSectionHeadingDocx('Experiencia Profesional'));
            for (const exp of cvData.workExperience) {
                children.push(
                    new Paragraph({
                        spacing: { before: 100, after: 40 },
                        children: [
                            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: 21 }),
                            new TextRun({ text: `  (${exp.period})`, italics: true, size: 20, color: '555555' })
                        ]
                    })
                );
                for (const item of exp.achievements || []) {
                    children.push(
                        new Paragraph({
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            children: [new TextRun({ text: item, size: 20 })]
                        })
                    );
                }
            }
        }

        // Proyectos Académicos y Personales
        if (cvData.academicAndPersonalProjects && cvData.academicAndPersonalProjects.length > 0) {
            children.push(createSectionHeadingDocx('Proyectos Relevantes'));
            for (const proj of cvData.academicAndPersonalProjects) {
                children.push(
                    new Paragraph({
                        spacing: { before: 100, after: 40 },
                        children: [
                            new TextRun({ text: `${proj.name} `, bold: true, size: 21 }),
                            new TextRun({ text: `[${proj.type}]`, italics: true, size: 19, color: '2B547E' }),
                            proj.toolsAndMethods?.length
                                ? new TextRun({ text: ` — ${proj.toolsAndMethods.join(', ')}`, size: 19, color: '555555' })
                                : new TextRun({ text: '' })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 40 },
                        children: [new TextRun({ text: proj.description, size: 20 })]
                    })
                );
                for (const hl of proj.highlights || []) {
                    children.push(
                        new Paragraph({
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            children: [new TextRun({ text: hl, size: 20 })]
                        })
                    );
                }
            }
        }

        // Formación Académica
        if (cvData.education && cvData.education.length > 0) {
            children.push(createSectionHeadingDocx('Formación Académica'));
            for (const edu of cvData.education) {
                children.push(
                    new Paragraph({
                        spacing: { before: 80, after: 40 },
                        children: [
                            new TextRun({ text: `${edu.degree} — ${edu.institution}`, bold: true, size: 20 }),
                            new TextRun({
                                text: ` (${edu.period}${edu.status ? ` - ${edu.status}` : ''})`,
                                size: 20,
                                color: '555555'
                            })
                        ]
                    })
                );
            }
        }

        // Certificaciones y Cursos
        if (cvData.certificationsAndCourses && cvData.certificationsAndCourses.length > 0) {
            children.push(createSectionHeadingDocx('Certificaciones y Cursos'));
            for (const cert of cvData.certificationsAndCourses) {
                children.push(
                    new Paragraph({
                        bullet: { level: 0 },
                        spacing: { after: 40 },
                        children: [new TextRun({ text: cert, size: 20 })]
                    })
                );
            }
        }

        // Idiomas
        if (cvData.languages && cvData.languages.length > 0) {
            children.push(
                createSectionHeadingDocx('Idiomas'),
                new Paragraph({
                    children: [new TextRun({ text: cvData.languages.join('  •  '), size: 20 })]
                })
            );
        }

        const doc = new Document({
            sections: [{ children }]
        });

        return await Packer.toBuffer(doc);
    },

    generatePdf: async (cvData: AdaptedCv): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 45, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            const addSectionTitle = (title: string): void => {
                doc.moveDown(0.7);
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#1B365D').text(title.toUpperCase());
                doc.moveTo(45, doc.y + 2).lineTo(550, doc.y + 2).strokeColor('#2B547E').lineWidth(1).stroke();
                doc.moveDown(0.4);
                doc.fillColor('#111111');
            };

            // Encabezado
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#1B365D')
                .text(cvData.personalInfo.fullName, { align: 'center' });
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#2B547E')
                .text(cvData.personalInfo.targetRoleTitle, { align: 'center' });

            const contactParts = [
                cvData.personalInfo.location,
                cvData.personalInfo.phone,
                cvData.personalInfo.email,
                cvData.personalInfo.linkedin,
                cvData.personalInfo.github,
                cvData.personalInfo.portfolio
            ].filter(Boolean);

            if (contactParts.length > 0) {
                doc.moveDown(0.2);
                doc.font('Helvetica').fontSize(9).fillColor('#555555')
                    .text(contactParts.join('  |  '), { align: 'center' });
            }

            // Perfil Profesional
            if (cvData.professionalSummary) {
                addSectionTitle('Perfil Profesional');
                doc.font('Helvetica').fontSize(10).text(cvData.professionalSummary, { align: 'justify' });
            }

            // Habilidades relevantes para el puesto, de cualquier sector.
            if (cvData.keySkills?.length) {
                addSectionTitle('Habilidades clave');
                for (const group of cvData.keySkills) {
                    doc.font('Helvetica-Bold').fontSize(9.5).text(`${group.category}: `, { continued: true });
                    doc.font('Helvetica').fontSize(9.5).text(group.skills.join(', '));
                    doc.moveDown(0.2);
                }
            }

            // Experiencia Profesional
            if (cvData.workExperience?.length) {
                addSectionTitle('Experiencia Profesional');
                for (const exp of cvData.workExperience) {
                    doc.font('Helvetica-Bold').fontSize(10).text(`${exp.role} — ${exp.company}`, { continued: true });
                    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#555555').text(` (${exp.period})`);
                    doc.fillColor('#111111');
                    for (const ach of exp.achievements || []) {
                        doc.font('Helvetica').fontSize(9.5).text(`•  ${ach}`, { indent: 12 });
                    }
                    doc.moveDown(0.3);
                }
            }

            // Proyectos
            if (cvData.academicAndPersonalProjects?.length) {
                addSectionTitle('Proyectos Relevantes');
                for (const proj of cvData.academicAndPersonalProjects) {
                    const toolsStr = proj.toolsAndMethods?.length ? ` — ${proj.toolsAndMethods.join(', ')}` : '';
                    doc.font('Helvetica-Bold').fontSize(10).text(`${proj.name} [${proj.type}]`, { continued: true });
                    doc.font('Helvetica').fontSize(9.5).fillColor('#555555').text(toolsStr);
                    doc.fillColor('#111111');
                    doc.font('Helvetica').fontSize(9.5).text(proj.description);
                    for (const hl of proj.highlights || []) {
                        doc.font('Helvetica').fontSize(9.5).text(`•  ${hl}`, { indent: 12 });
                    }
                    doc.moveDown(0.3);
                }
            }

            // Educación
            if (cvData.education?.length) {
                addSectionTitle('Formación Académica');
                for (const edu of cvData.education) {
                    doc.font('Helvetica-Bold').fontSize(9.5).text(`${edu.degree} — ${edu.institution}`, { continued: true });
                    doc.font('Helvetica').fontSize(9.5).fillColor('#555555')
                        .text(` (${edu.period}${edu.status ? ` - ${edu.status}` : ''})`);
                    doc.fillColor('#111111');
                }
            }

            // Certificaciones
            if (cvData.certificationsAndCourses?.length) {
                addSectionTitle('Certificaciones y Cursos');
                for (const cert of cvData.certificationsAndCourses) {
                    doc.font('Helvetica').fontSize(9.5).text(`•  ${cert}`, { indent: 12 });
                }
            }

            // Idiomas
            if (cvData.languages?.length) {
                addSectionTitle('Idiomas');
                doc.font('Helvetica').fontSize(9.5).text(cvData.languages.join('  •  '));
            }

            doc.end();
        });
    }
};