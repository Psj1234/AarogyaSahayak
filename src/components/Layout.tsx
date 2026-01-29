import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Activity, Bell, Users, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: t('nav.home'),
      ariaLabel: 'Navigate to home page'
    },
    { 
      path: '/vitals', 
      icon: Activity, 
      label: t('nav.vitals'),
      ariaLabel: 'Navigate to vitals tracking'
    },
    { 
      path: '/reminders', 
      icon: Bell, 
      label: t('nav.reminders'),
      ariaLabel: 'Navigate to medication reminders'
    },
    { 
      path: '/connect', 
      icon: Users, 
      label: t('nav.connect'),
      ariaLabel: 'Connect with health workers'
    },
    { 
      path: '/feed', 
      icon: BookOpen, 
      label: t('nav.feed'),
      ariaLabel: 'View health information feed'
    },
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
      }
    },
    out: { 
      opacity: 0, 
      y: -20, 
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.6, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Enhanced Theme Toggle - Fixed position for easy access */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="fixed top-6 right-6 z-50"
      >
        <div className="bg-card/90 backdrop-blur-lg rounded-2xl p-2 shadow-float border border-border/50">
          <ThemeToggle />
        </div>
      </motion.div>
      
      {/* Page Content with Enhanced Animations */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          className="pb-24 min-h-screen"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      {/* Premium Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        className="fixed bottom-0 left-0 right-0 z-40"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="bg-card/95 backdrop-blur-xl border-t border-border/30 shadow-float">
          <div className="max-w-lg mx-auto px-6">
            <div className="flex justify-center items-center py-3 gap-1">
              {navItems.map(({ path, icon: Icon, label, ariaLabel }) => {
                const isActive = location.pathname === path;
                return (
                  <motion.div
                    key={path}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link
                      to={path}
                      className={cn(
                        "flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 relative w-[68px] min-h-[58px] focus-visible border border-transparent justify-center",
                        isActive
                          ? "text-primary bg-primary/10 shadow-button border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/70 hover:border-accent/50"
                      )}
                      aria-label={ariaLabel}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {/* Active indicator with smooth animation */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="activeNavTab"
                            className="absolute inset-0 bg-primary/8 rounded-2xl border border-primary/25"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ 
                              type: "spring", 
                              bounce: 0.25, 
                              duration: 0.6 
                            }}
                          />
                        )}
                      </AnimatePresence>
                      
                      {/* Icon with enhanced hover effect */}
                      <div className="relative z-10 mb-1.5">
                        <Icon 
                          size={20} 
                          className={cn(
                            "transition-all duration-300",
                            isActive ? "text-primary" : ""
                          )}
                          aria-hidden="true"
                        />
                      </div>
                      
                      {/* Label with smooth transitions */}
                      <span className={cn(
                        "text-[11px] font-medium relative z-10 font-inter transition-all duration-300 text-center leading-none max-w-[60px] truncate block",
                        isActive ? "text-primary font-semibold" : ""
                      )}>
                        {label}
                      </span>
                      
                      {/* Subtle active dot indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full z-10"
                          transition={{ delay: 0.1 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default Layout;