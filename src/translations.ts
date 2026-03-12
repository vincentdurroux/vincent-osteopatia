export type Language = 'fr' | 'en' | 'es';

export const translations = {
  fr: {
    nav: {
      services: 'Services',
      about: 'À Propos',
      clinic: 'Cabinet',
      contact: 'Contact',
      book: 'Prendre RDV',
    },
    hero: {
      subtitle: "Cabinet d'Ostéopathie",
      title: 'Retrouvez votre',
      titleItalic: 'équilibre naturel',
      desc: 'Soins ostéopathiques doux et personnalisés à L\'Eliana, Valencia. J\'accompagne nourrissons, sportifs et adultes vers un mieux-être durable.',
      ctaPrimary: 'Prendre rendez-vous',
      ctaSecondary: 'Mes services',
      quote: '"L\'ostéopathie est l\'art de restaurer la santé."',
    },
    services: {
      title: 'Comment puis-je vous aider...',
      musculoskeletal: {
        title: 'Douleurs et Troubles Musculo-squelettiques',
        intro: 'Les problèmes musculo-squelettiques sont les raisons les plus courantes de consultation en ostéopathie. L\'ostéopathie peut aider à soulager :',
        items: [
          'Douleurs dorsales et lombaires : lombalgie chronique ou aiguë, sciatique, inconfort lié à une hernie discale',
          'Douleurs cervicales : raideur, tension, coup du lapin, maux de tête cervicogéniques',
          'Douleurs de l\'épaule, du coude, du poignet, de la hanche, du genou et de la cheville : tendinite, raideur articulaire, microtraumatismes répétés',
          'Tensions musculaires et déséquilibres posturaux : causés par une position assise prolongée, une mauvaise posture ou des problèmes ergonomiques',
          'Problèmes liés aux traumatismes : post-entorse, post-fracture ou blessures sportives'
        ]
      },
      functional: {
        title: 'Troubles Fonctionnels',
        intro: 'Troubles fonctionnels causés par une altération du mouvement ou une tension dans le corps plutôt que par une maladie structurelle. Ceux-ci incluent :',
        items: [
          'Problèmes digestifs : ballonnements, constipation, reflux ou inconfort abdominal lié à une tension musculaire ou viscérale',
          'Problèmes respiratoires : difficultés respiratoires légères, tension du diaphragme',
          'Maux de tête et migraines : souvent liés à des tensions dans le cou, la mâchoire ou les structures crâniennes',
          'Troubles de l\'ATM : tension de la mâchoire, claquements ou inconfort',
          'Tension liée au stress : tiraillements musculaires, raideur ou inconfort'
        ]
      },
      family: {
        title: 'Femmes Enceintes, Post-partum et Enfants',
        items: [
          'Soulagement des douleurs lombaires, de la sciatique et de l\'inconfort digestif pendant la grossesse',
          'Préparation du bassin à l\'accouchement et récupération post-partum',
          'Nourrissons : coliques, reflux, troubles du sommeil, syndrome de la tête plate ou torticolis',
          'Enfants : soutien à la croissance, à la posture et à l\'équilibre musculo-squelettique'
        ]
      },
      athletesSeniors: {
        title: 'Sportifs et Seniors',
        athletes: {
          title: 'Pour les Sportifs :',
          items: [
            'Prévention des foulures, entorses et blessures de surmenage',
            'Soutien à la récupération après l\'entraînement ou des blessures sportives',
            'Amélioration de la souplesse, de la posture et de l\'efficacité du mouvement',
            'Soulagement des douleurs musculo-squelettiques chroniques ou aiguës'
          ]
        },
        seniors: {
          title: 'Pour les Seniors :',
          items: [
            'Maintien de la mobilité articulaire et de la souplesse musculaire',
            'Réduction de la raideur et de l\'inconfort liés à l\'âge',
            'Soutien de l\'équilibre et sécurisation des mouvements quotidiens',
            'Amélioration du confort général et de la qualité de vie'
          ]
        }
      }
    },
    location: {
      title: 'Le Cabinet',
      desc: 'Situé au cœur de L\'Eliana, je vous accueille dans un environnement calme et serein, propice à la détente et aux soins.',
      address: 'Adresse',
      fees: 'Tarifs',
      session: 'La séance (1h) : 60€',
      bono3: 'Forfait 3 séances : 160€',
      bono5: 'Forfait 5 séances : 250€',
      fullAddress: 'Calle General Pastor, 25, 46183 L\'Eliana, Valence',
    },
    about: {
      title: 'Mon Parcours',
      p1: 'Ostéopathe français fort de plus de 10 ans d\'expérience internationale, j\'ai exercé au Canada et en France avant de m\'installer en Espagne.',
      p2: 'Diplômé de l\'Institut des Hautes Études Ostéopathiques (IdHEO) de Nantes après un cursus rigoureux de 5 ans, ma pratique se veut holistique et sur-mesure.',
      p3: 'J\'accompagne chaque patient, du nouveau-né au senior, en adaptant mes techniques — structurelles, crâniennes ou viscérales — aux besoins spécifiques de votre corps.',
      languages: 'Pour votre confort, les consultations peuvent se dérouler en Français🇫🇷, Anglais🇬🇧 ou Espagnol🇪🇸',
    },
    footer: {
      desc: 'Votre partenaire santé à Valencia. Une approche globale pour un corps en harmonie.',
      links: 'Liens Rapides',
      direct: 'Contact Direct',
      rights: 'Tous droits réservés',
      note: '⚠️ Note : L\'ostéopathie en Espagne n\'est pas une profession médicale. Je ne fournis pas de diagnostics médicaux, mais j\'aide à soulager les tensions et à favoriser le bien-être, en toute sécurité et en complément de vos soins médicaux.',
    }
  },
  en: {
    nav: {
      services: 'Services',
      about: 'About',
      clinic: 'Clinic',
      contact: 'Contact',
      book: 'Book Appointment',
    },
    hero: {
      subtitle: 'Osteopathy Clinic',
      title: 'Find your',
      titleItalic: 'natural balance',
      desc: 'Gentle and personalized osteopathic care in L\'Eliana, Valencia. I support infants, athletes, and adults towards lasting well-being.',
      ctaPrimary: 'Book an appointment',
      ctaSecondary: 'My services',
      quote: '"Osteopathy is the art of restoring health."',
    },
    services: {
      title: 'How can I help you...',
      musculoskeletal: {
        title: 'Musculoskeletal Pain and Disorders',
        intro: 'Musculoskeletal issues are the most common reasons people seek osteopathic care. Osteopathy can help relieve:',
        items: [
          'Back pain and lower back issues: chronic or acute lumbar pain, sciatica, herniated disc discomfort',
          'Neck and cervical pain: stiffness, tension, whiplash, cervicogenic headaches',
          'Shoulder, elbow, wrist, hip, knee, and ankle pain: tendonitis, joint stiffness, repetitive strain injuries',
          'Muscle tension and postural imbalances: caused by prolonged sitting, poor posture, or ergonomic issues',
          'Trauma-related issues: post-sprain, post-fracture, or sports injuries'
        ]
      },
      functional: {
        title: 'Functional Disorders',
        intro: 'Functional disorders caused by impaired movement or tension in the body rather than by structural disease. These include:',
        items: [
          'Digestive problems: bloating, constipation, reflux, or abdominal discomfort linked to muscular or visceral tension',
          'Respiratory issues: mild breathing difficulties, tension in the diaphragm',
          'Headaches and migraines: often related to tension in the neck, jaw, or cranial structures',
          'TMJ disorders: jaw tension, clicking, or discomfort',
          'Stress-related tension: muscle tightness, stiffness, or discomfort'
        ]
      },
      family: {
        title: 'Pregnant Women, Postpartum, and Children',
        items: [
          'Relief of lower back pain, sciatica, and digestive discomfort during pregnancy',
          'Preparation of the pelvis for childbirth and postpartum recovery',
          'Infants: colic, reflux, sleep issues, flat head syndrome, or torticolis',
          'Children: support for growth, posture, and musculoskeletal balance'
        ]
      },
      athletesSeniors: {
        title: 'Athletes and Seniors',
        athletes: {
          title: 'For Athletes:',
          items: [
            'Preventing strains, sprains, and overuse injuries',
            'Supporting recovery after training or sports injuries',
            'Improving flexibility, posture, and movement efficiency',
            'Relieving chronic or acute musculoskeletal pain'
          ]
        },
        seniors: {
          title: 'For Seniors:',
          items: [
            'Maintaining joint mobility and muscle flexibility',
            'Reducing stiffness and age-related discomfort',
            'Supporting balance and safer daily movements',
            'Enhancing overall comfort and quality of life'
          ]
        }
      }
    },
    location: {
      title: 'The Clinic',
      desc: 'Located in the heart of L\'Eliana, I welcome you in a calm and serene environment, conducive to relaxation and care.',
      address: 'Address',
      fees: 'Fees',
      session: 'Single session (1h): 60€',
      bono3: '3-session package: 160€',
      bono5: '5-session package: 250€',
      fullAddress: 'Calle General Pastor, 25, 46183 L\'Eliana, Valencia',
    },
    about: {
      title: 'My Background',
      p1: 'A French osteopath with over 10 years of international experience, I practiced in Canada and France before moving to Spain.',
      p2: 'After graduating from the prestigious Institut des Hautes Études Ostéopathiques in Nantes following five years of intensive full-time study, I have dedicated my career to personalized patient care.',
      p3: 'From infants to seniors, I tailor my approach — whether structural, cranial, or visceral — to the unique requirements of each individual.',
      languages: 'I am pleased to offer consultations in English🇬🇧, French🇫🇷, and Spanish🇪🇸',
    },
    footer: {
      desc: 'Your health partner in Valencia. A global approach for a body in harmony.',
      links: 'Quick Links',
      direct: 'Direct Contact',
      rights: 'All rights reserved',
      note: '⚠️ Note: Osteopathy in Spain is not a medical profession. I don’t provide medical diagnoses, but I help relieve tension and support well-being, safely and alongside your medical care.',
    }
  },
  es: {
    nav: {
      services: 'Servicios',
      about: 'Sobre nosotros',
      clinic: 'Clínica',
      contact: 'Contacto',
      book: 'Pedir Cita',
    },
    hero: {
      subtitle: 'Clínica de Osteopatía',
      title: 'Encuentra tu',
      titleItalic: 'equilibrio natural',
      desc: 'Cuidados osteopáticos suaves y personalizados en L\'Eliana, Valencia. Acompaño a bebés, deportistas y adultos hacia un bienestar duradero.',
      ctaPrimary: 'Pedir cita',
      ctaSecondary: 'Mis servicios',
      quote: '"La osteopatía es el arte de restaurar la salud."',
    },
    services: {
      title: 'Cómo puedo ayudarte...',
      musculoskeletal: {
        title: 'Dolores y Trastornos Musculoesqueléticos',
        intro: 'Los problemas musculoesqueléticos son las razones más comunes por las que las personas buscan atención osteopática. La osteopatía puede ayudar a aliviar:',
        items: [
          'Dolor de espalda y problemas lumbares: dolor lumbar crónico o agudo, ciática, molestias por hernia discal',
          'Dolor de cuello y cervical: rigidez, tensión, latigazo cervical, dolores de cabeza cervicogénicos',
          'Dolor de hombro, codo, muñeca, cadera, rodilla y tobillo: tendinitis, rigidez articular, lesiones por esfuerzo repetitivo',
          'Tensión muscular y desequilibrios posturales: causados por estar sentado de forma prolongada, mala postura o problemas ergonómicos',
          'Problemas relacionados con traumatismos: post-esguince, post-fracture o lesiones deportivas'
        ]
      },
      functional: {
        title: 'Trastornos Funcionales',
        intro: 'Trastornos funcionales causados por el movimiento alterado o la tensión en el cuerpo en lugar de por una enfermedad estructural. Estos incluyen:',
        items: [
          'Problemas digestivos: hinchazón, estreñimiento, reflujo o molestias abdominales relacionadas con la tensión muscular o visceral',
          'Problemas respiratorios: dificultades respiratorias leves, tensión en el diafragma',
          'Dolores de cabeza y migrañas: a menudo relacionados con la tensión en el cuello, la mandíbula o las estructuras craneales',
          'Trastornos de la ATM: tensión en la mandíbula, chasquidos o molestias',
          'Tensión relacionada con el estrés: tirantez muscular, rigidez o malestar'
        ]
      },
      family: {
        title: 'Mujeres Embarazadas, Postparto y Niños',
        items: [
          'Alivio del dolor lumbar, la ciática y las molestias digestivas durante el embarazo',
          'Preparación de la pelvis para el parto y recuperación postparto',
          'Bebés: cólicos, reflujo, problemas de sueño, síndrome de cabeza plana o tortícolis',
          'Niños: apoyo al crecimiento, la postura y el equilibrio musculoesquelético'
        ]
      },
      athletesSeniors: {
        title: 'Deportistas y Personas Mayores',
        athletes: {
          title: 'Para Deportistas:',
          items: [
            'Prevención de distensiones, esguinces y lesiones por sobrecarga',
            'Apoyo a la recuperación después del entrenamiento o lesiones deportivas',
            'Mejora de la flexibilidad, la postura y la eficiencia del movimiento',
            'Alivio del dolor musculoesquelético crónico o agudo'
          ]
        },
        seniors: {
          title: 'Para Personas Mayores:',
          items: [
            'Mantenimiento de la movilidad articular y la flexibilidad muscular',
            'Reducción de la rigidez y las molestias relacionadas con la edad',
            'Apoyo al equilibrio y movimientos diarios más seguros',
            'Mejora del confort general y la calidad de vida'
          ]
        }
      }
    },
    location: {
      title: 'La Clínica',
      desc: 'Situada en el corazón de L\'Eliana, le doy la bienvenida en un entorno tranquilo y sereno, propicio para la relajación y el cuidado.',
      address: 'Dirección',
      fees: 'Tarifas',
      session: '60€ / 1h',
      bono3: 'Bono 3 sesiones: 160€',
      bono5: 'Bono 5 sesiones: 250€',
      fullAddress: 'Calle General Pastor, 25, 46183 L\'Eliana, Valencia',
    },
    about: {
      title: 'Mi Trayectoria',
      p1: 'Osteópata francés con más de 10 años de experiencia internacional, ejercí en Canadá y Francia antes de instalarme en España.',
      p2: 'Graduado en el prestigioso Institut des Hautes Études Ostéopathiques de Nantes tras 5 años de formación intensiva, mi enfoque se centra en la atención personalizada y el bienestar integral.',
      p3: 'Trato a pacientes de todas las edades, desde bebés hasta personas mayores, adaptando mis técnicas —estructurales, craneales o viscerales— a las necesidades específicas de cada cuerpo.',
      languages: 'Para su comodidad, las consultas están disponibles en Español🇪🇸, Francés🇫🇷 e Inglés🇬🇧',
    },
    footer: {
      desc: 'Su socio de salud en Valencia. Un enfoque global para un cuerpo en armonía.',
      links: 'Enlaces Rápidos',
      direct: 'Contacto Directo',
      rights: 'Todos los derechos reservados',
      note: '⚠️ Nota: La osteopatía en España no es una profesión médica. No proporciono diagnósticos médicos, sino que ayudo a aliviar la tensión y a fomentar el bienestar, de forma segura y en complemento de su atención médica.',
    }
  }
};
