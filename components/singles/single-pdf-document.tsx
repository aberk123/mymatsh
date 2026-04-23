'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A1A',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#7B2D5E',
    paddingBottom: 10,
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#7B2D5E',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subheading: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#7B2D5E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8D5E5',
    paddingBottom: 3,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  field: {
    width: '48%',
    marginBottom: 4,
  },
  fieldFull: {
    width: '100%',
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: '#888888',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    color: '#1A1A1A',
  },
  bio: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  refRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8EE',
  },
  refName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A1A',
  },
  refDetail: {
    fontSize: 9,
    color: '#555555',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E8D5E5',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#AAAAAA',
  },
})

interface SingleData {
  first_name: string
  last_name: string
  full_hebrew_name?: string | null
  gender?: string | null
  age?: number | null
  dob?: string | null
  height_inches?: number | null
  city?: string | null
  state?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  hashkafa?: string | null
  plans?: string | null
  about_bio?: string | null
  looking_for?: string | null
  occupation?: string | null
  current_education?: string | null
  current_yeshiva_seminary?: string | null
  eretz_yisroel?: string | null
  family_background?: string | null
  hair_color?: string | null
  eye_color?: string | null
  body_type?: string | null
  complexion?: string | null
  minyan_attendance?: string | null
  shabbos_observance?: string | null
  smoking?: string | null
  dietary_restrictions?: string | null
  hobbies?: string | null
  personality_traits?: string | null
}

interface RefData {
  name: string
  relationship?: string | null
  phone?: string | null
  email?: string | null
}

interface EducationData {
  elementary_school?: string | null
  post_high_school?: string | null
  bachelors_degree?: string | null
  grad_degree?: string | null
}

interface FamilyData {
  fathers_name?: string | null
  fathers_occupation?: string | null
  mothers_name?: string | null
  mothers_maiden_name?: string | null
  mothers_occupation?: string | null
  num_siblings?: number | null
  family_notes?: string | null
}

interface Props {
  single: SingleData
  education?: EducationData | null
  family?: FamilyData | null
  references?: RefData[]
}

function heightLabel(inches: number | null | undefined) {
  if (!inches) return null
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function FieldFull({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={styles.fieldFull}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function SinglePdfDocument({ single, education, family, references = [] }: Props) {
  const fullName = `${single.first_name} ${single.last_name}`
  const location = [single.city, single.state, single.country].filter(Boolean).join(', ')
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <Document title={`${fullName} — MyMatSH Profile`} author="MyMatSH">
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>MyMatSH</Text>
          <Text style={styles.tagline}>Confidential Single Profile</Text>
        </View>

        {/* Name */}
        <Text style={styles.name}>{fullName}</Text>
        {single.full_hebrew_name && <Text style={styles.subheading}>{single.full_hebrew_name}</Text>}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.grid}>
            <Field label="Gender" value={single.gender === 'male' ? 'Male' : single.gender === 'female' ? 'Female' : single.gender} />
            <Field label="Age" value={single.age ? String(single.age) : null} />
            <Field label="Height" value={heightLabel(single.height_inches)} />
            <Field label="Location" value={location || null} />
            <Field label="Hashkafa" value={single.hashkafa?.replace(/_/g, ' ')} />
            <Field label="Plans" value={single.plans} />
            <Field label="Occupation" value={single.occupation} />
            <Field label="Phone" value={single.phone} />
            <Field label="Email" value={single.email} />
          </View>
        </View>

        {/* About */}
        {single.about_bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{single.about_bio}</Text>
          </View>
        )}

        {/* Looking For */}
        {single.looking_for && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <Text style={styles.bio}>{single.looking_for}</Text>
          </View>
        )}

        {/* Appearance & Lifestyle */}
        {(single.hair_color || single.eye_color || single.body_type || single.smoking || single.dietary_restrictions || single.hobbies) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance & Lifestyle</Text>
            <View style={styles.grid}>
              <Field label="Hair" value={single.hair_color} />
              <Field label="Eyes" value={single.eye_color} />
              <Field label="Build" value={single.body_type} />
              <Field label="Complexion" value={single.complexion} />
              <Field label="Smoking" value={single.smoking} />
              <Field label="Dietary" value={single.dietary_restrictions} />
            </View>
            {single.hobbies && <FieldFull label="Hobbies" value={single.hobbies} />}
          </View>
        )}

        {/* Religious */}
        {(single.minyan_attendance || single.shabbos_observance) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Religious Practice</Text>
            <View style={styles.grid}>
              <Field label="Minyan" value={single.minyan_attendance} />
              <Field label="Shabbos" value={single.shabbos_observance} />
            </View>
          </View>
        )}

        {/* Education */}
        {education && (education.elementary_school || education.post_high_school || education.bachelors_degree || education.grad_degree) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.grid}>
              <Field label="Elementary" value={education.elementary_school} />
              <Field label="Post High School" value={education.post_high_school} />
              <Field label="Bachelor's" value={education.bachelors_degree} />
              <Field label="Graduate" value={education.grad_degree} />
              <Field label="Yeshiva / Seminary" value={single.current_yeshiva_seminary} />
              <Field label="Eretz Yisroel" value={single.eretz_yisroel} />
            </View>
          </View>
        )}

        {/* Family */}
        {family && (family.fathers_name || family.mothers_name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family</Text>
            <View style={styles.grid}>
              <Field label="Father" value={family.fathers_name} />
              <Field label="Father's Occupation" value={family.fathers_occupation} />
              <Field label="Mother" value={family.mothers_name ? `${family.mothers_name}${family.mothers_maiden_name ? ` (née ${family.mothers_maiden_name})` : ''}` : null} />
              <Field label="Mother's Occupation" value={family.mothers_occupation} />
              <Field label="Siblings" value={family.num_siblings !== null && family.num_siblings !== undefined ? String(family.num_siblings) : null} />
            </View>
            {family.family_notes && <FieldFull label="Notes" value={family.family_notes} />}
          </View>
        )}

        {/* References */}
        {references.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>References</Text>
            {references.map((ref, i) => (
              <View key={i} style={styles.refRow}>
                <Text style={styles.refName}>{ref.name}{ref.relationship ? ` — ${ref.relationship}` : ''}</Text>
                {(ref.phone || ref.email) && (
                  <Text style={styles.refDetail}>{[ref.phone, ref.email].filter(Boolean).join(' · ')}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>MyMatSH — Confidential</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  )
}
