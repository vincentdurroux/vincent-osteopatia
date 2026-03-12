import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Calendar, ChevronRight, Heart, User, Activity, Baby, Globe, Check, CreditCard, Bone, Zap, Trophy, Menu, X } from 'lucide-react';
import SpineLogo from './components/SpineLogo';
import { translations, Language } from './translations';

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations['fr'];
}>({
  lang: 'fr',
  setLang: () => {},
  t: translations.fr,
});

const useTranslation = () => useContext(LanguageContext);

const LanguageSelector = () => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-primary/5 transition-colors text-primary/80"
      >
        <Globe size={18} />
        <span className="uppercase text-xs font-bold tracking-widest">{lang}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 z-50 overflow-hidden"
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span>{l.flag}</span>
                    <span className={lang === l.code ? "font-bold text-primary" : "text-gray-600"}>
                      {l.label}
                    </span>
                  </div>
                  {lang === l.code && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f5f5f0]/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
            <SpineLogo size={24} className="sm:w-7 sm:h-7" />
          </div>
          <span className="text-xl sm:text-2xl font-serif font-semibold tracking-tight whitespace-nowrap">Vincent Osteopatía</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-primary/80">
          <a href="#services" className="hover:text-primary transition-colors">{t.nav.services}</a>
          <a href="#about" className="hover:text-primary transition-colors">{t.nav.about}</a>
          <a href="#location" className="hover:text-primary transition-colors">{t.nav.clinic}</a>
          <a href="#contact" className="hover:text-primary transition-colors">{t.nav.contact}</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          <a 
            href="https://wa.me/34614159462"
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button text-sm sm:text-sm uppercase tracking-widest font-semibold hidden xs:block"
          >
            {t.nav.book}
          </a>
          <button 
            className="lg:hidden p-2 text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-black/5 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6 text-sm font-medium uppercase tracking-widest text-primary/80">
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">{t.nav.services}</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">{t.nav.about}</a>
              <a href="#location" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">{t.nav.clinic}</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">{t.nav.contact}</a>
              <a 
                href="https://wa.me/34614159462"
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button text-center"
              >
                {t.nav.book}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onOpenBooking }: { onOpenBooking: () => void }) => {
  const { t } = useTranslation();

  return (
    <section className="pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <span className="text-primary font-medium tracking-widest uppercase text-xs sm:text-sm mb-4 block">{t.hero.subtitle}</span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight mb-6">
            {t.hero.title} <br />
            <span className="italic">{t.hero.titleItalic}</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
            {t.hero.desc}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
            <button 
              onClick={onOpenBooking}
              className="primary-button flex items-center justify-center gap-2"
            >
              {t.hero.ctaPrimary} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex justify-center items-center mt-12 lg:mt-0"
        >
          <div className="relative">
            <img 
              src="/palm-tree.JPG" 
              alt="Vincent Osteopatía" 
              className="w-64 h-64 xl:w-80 xl:h-80 rounded-full object-cover shadow-2xl border-4 border-white"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 -left-8 bg-white p-5 rounded-2xl shadow-xl max-w-[200px]">
              <p className="text-lg sm:text-base font-serif italic text-primary leading-relaxed">{t.hero.quote}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ServiceCard = ({ 
  image,
  title, 
  intro, 
  items, 
  extraContent 
}: { 
  image: string,
  title: string, 
  intro?: string, 
  items: string[],
  extraContent?: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useTranslation();

  return (
    <div 
      className="relative group"
      onClick={() => setIsOpen(!isOpen)}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card aspect-square relative overflow-hidden cursor-pointer transition-all duration-500 group-hover:shadow-2xl lg:group-hover:-translate-y-2 border border-transparent group-hover:border-primary/10"
      >
        <img 
          src={image} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-white text-xl sm:text-lg md:text-xl lg:text-2xl font-serif leading-tight drop-shadow-lg">{title}</h3>
          <div className="mt-4 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-white text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            {lang === 'fr' ? 'Détails' : lang === 'es' ? 'Detalles' : 'Details'}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 m-auto h-fit max-h-[80vh] w-[calc(100%-2rem)] max-w-[400px] z-50 bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-primary/20 flex flex-col overflow-y-auto origin-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg sm:text-2xl font-serif text-primary">{title}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              {intro && <p className="text-gray-600 mb-6 text-sm sm:text-sm leading-relaxed italic border-l-2 border-primary/20 pl-4">{intro}</p>}
              <ul className="space-y-2 sm:space-y-3 mb-6">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-700 text-sm sm:text-sm">
                    <Check size={14} className="text-primary mt-1 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {extraContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Services = () => {
  const { t } = useTranslation();
  
  return (
    <section id="services" className="py-16 sm:py-20 px-4 sm:px-6 bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4">{t.services.title}</h2>
          <div className="w-16 sm:w-20 h-1 bg-primary/20 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <ServiceCard 
            image="https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&q=80&w=600"
            title={t.services.musculoskeletal.title}
            items={t.services.musculoskeletal.items}
          />

          <ServiceCard 
            image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600"
            title={t.services.functional.title}
            items={t.services.functional.items}
          />

          <ServiceCard 
            image="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=600"
            title={t.services.family.title}
            items={t.services.family.items}
          />

          <ServiceCard 
            image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600"
            title={t.services.athletesSeniors.title}
            items={[]}
            extraContent={
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold text-primary mb-2 sm:mb-3 uppercase tracking-wider text-sm sm:text-xs">{t.services.athletesSeniors.athletes.title}</h4>
                  <ul className="space-y-1 sm:space-y-2">
                    {t.services.athletesSeniors.athletes.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-700 text-sm sm:text-sm">
                        <Check size={12} className="text-primary mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2 sm:mb-3 uppercase tracking-wider text-sm sm:text-xs">{t.services.athletesSeniors.seniors.title}</h4>
                  <ul className="space-y-1 sm:space-y-2">
                    {t.services.athletesSeniors.seniors.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-700 text-sm sm:text-sm">
                        <Check size={12} className="text-primary mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
};

const About = () => {
  const { t } = useTranslation();
  return (
    <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4">{t.about.title}</h2>
          <div className="w-16 sm:w-20 h-1 bg-primary/20 mx-auto"></div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="space-y-6 text-base sm:text-lg text-gray-700 leading-relaxed">
              <p className="font-medium text-primary">{t.about.p1}</p>
              <p>{t.about.p2}</p>
              <p>{t.about.p3}</p>
              <div className="pt-4 border-t border-primary/10">
                <p className="font-serif italic text-primary text-lg sm:text-base">{t.about.languages}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="aspect-[4/5] w-full max-w-[220px] sm:max-w-[280px] rounded-[30px] lg:rounded-[40px] overflow-hidden shadow-2xl relative">
              <img 
                src="/photo-profile.jpg" 
                alt="Vincent - Osteopath" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Location = () => {
  const { t } = useTranslation();
  return (
    <section id="location" className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4">{t.location.title}</h2>
          <div className="w-16 sm:w-20 h-1 bg-primary/20 mx-auto"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:max-w-2xl md:mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="aspect-[3/4] rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-xl"
            >
              <img 
                src="/cabinet-exterieur.png" 
                alt="Cabinet Exterior" 
                className="w-full h-full object-cover cursor-pointer"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="aspect-[3/4] rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-xl mt-8 sm:mt-12"
            >
              <img 
                src="/cabinet-interieur.png" 
                alt="Cabinet Interior" 
                className="w-full h-full object-cover cursor-pointer"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
            {t.location.desc}
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{t.location.address}</h4>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">{t.location.fullAddress}</p>
                <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden shadow-inner border border-primary/10">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3075.760775820469!2d-0.5312344!3d39.5650222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd60596384000001%3A0x6d9a9d9a9d9a9d9a!2sC.%20Gral.%20Pastor%2C%2025%2C%2046183%20L'Eliana%2C%20Valencia%2C%20Spain!5e0!3m2!1sen!2sfr!4v1710245000000!5m2!1sen!2sfr" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps Location"
                  ></iframe>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t.location.fees}</h4>
                <p className="text-gray-500 text-sm sm:text-base">{t.location.session}</p>
                <p className="text-gray-500 text-sm sm:text-base">{t.location.bono3}</p>
                <p className="text-gray-500 text-sm sm:text-base">{t.location.bono5}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer id="contact" className="bg-primary text-white py-20 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">
              <SpineLogo size={28} />
            </div>
            <h3 className="text-3xl font-serif">Vincent Osteopatía</h3>
          </div>
          <p className="text-white/60 leading-relaxed mb-6">
            {t.footer.desc}
          </p>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-widest font-semibold mb-6 text-white/40">{t.footer.links}</h4>
          <ul className="space-y-4 text-lg font-serif">
            <li><a href="#" className="hover:text-accent transition-colors">{t.nav.about}</a></li>
            <li><a href="#services" className="hover:text-accent transition-colors">{t.nav.services}</a></li>
            <li><a href="#location" className="hover:text-accent transition-colors">{t.nav.clinic}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-widest font-semibold mb-6 text-white/40">{t.footer.direct}</h4>
          <p className="text-2xl font-serif mb-8">+34 614 159 462</p>
          <a 
            href="https://wa.me/34614159462"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-[#25D366] text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#128C7E] transition-colors inline-flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center">
        <p className="text-white/60 text-sm mb-6 max-w-3xl mx-auto leading-relaxed italic hover:scale-[1.02] transition-transform duration-300 cursor-default">
          {t.footer.note}
        </p>
        <div className="text-white/40 text-xs uppercase tracking-widest">
          © 2026 Vincent Osteopatía — {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

const BookingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#f5f5f0] rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-serif font-semibold">{t.nav.book}</h3>
              <p className="text-gray-600 mt-2">{t.booking.subtitle}</p>
            </div>

            <div className="flex flex-col gap-4">
              <a 
                href="https://wa.me/34614159462"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-semibold uppercase tracking-widest text-sm hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/20"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>

              <a 
                href="tel:+34614159462"
                className="w-full py-4 bg-primary text-white rounded-2xl font-semibold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
              >
                <Phone size={20} />
                {t.booking.call}
              </a>

              <a 
                href="mailto:vincentosteopath1@gmail.com"
                className="w-full py-4 bg-white text-primary border border-black/5 rounded-2xl font-semibold uppercase tracking-widest text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm"
              >
                <Mail size={20} />
                Email
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      <div className="min-h-screen">
        <Navbar />
        <Hero onOpenBooking={() => setIsBookingModalOpen(true)} />
        <Services />
        <About />
        <Location />
        <Footer />
        <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
      </div>
    </LanguageContext.Provider>
  );
}
