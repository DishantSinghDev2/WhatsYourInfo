'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { GradientEditor } from './GradientEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/types';

export function CustomColorMenu({ design, setDesign }: { design: UserProfile['design']; setDesign: (cb: UserProfile['design']) => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const isSelected = design.theme === 'custom';
  const customMenuRef = useRef<HTMLDivElement>(null);

  const customColors = useMemo(() => {
    return (
      design.customColors || {
        background: '#ffffff',
        surface: '#f4f4f4',
        accent: '#3b82f6',
      }
    );
  }, [design.customColors]);

  // Effect to handle clicks outside of the custom menu to close the color selector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customMenuRef.current && !customMenuRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [customMenuRef]);

  const isGradient = (val: string) => val?.startsWith('linear-gradient');
  const defaultTab = openKey ? (isGradient(customColors[openKey]) ? 'gradient' : 'solid') : 'solid';

  return (
    <div ref={customMenuRef} className="w-full mt-4">
      <button
        onClick={() => {
          if (!isSelected) {
            setDesign((prev: UserProfile['design']) => ({
              ...prev,
              theme: 'custom',
              customColors,
            }));
          }
        }}
        className={`relative border rounded-md p-3 pr-2 text-left group transition-all duration-300 h-[90px] ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
      >
        <div className="relative h-6 w-6 mx-auto mt-1 flex justify-center">
          <span className="absolute w-6 h-6 border border-gray-400 rounded-full transition-all duration-300 group-hover:translate-x-[-10px] group-hover:scale-110 z-10" style={{ background: customColors.surface }} />
          <span className="absolute w-6 h-6 border border-gray-400 rounded-full translate-x-[6px] transition-all duration-300 group-hover:translate-x-[0px] group-hover:scale-110 z-20" style={{ background: customColors.background }} />
          <span className="absolute w-6 h-6 border border-gray-400 rounded-full translate-x-[12px] transition-all duration-300 group-hover:translate-x-[10px] group-hover:scale-110 z-30" style={{ background: customColors.accent }} />
        </div>
        <span className="block text-xs mt-6 font-medium text-center">Custom</span>
      </button>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            className=" p-4 grid gap-3 overflow-hidden"
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs font-medium text-gray-500 mb-1">Customize Theme</div>

            <div className="flex flex-col gap-2">
              {['background', 'surface', 'accent'].map((key) => (
                <div key={key}>
                  <button
                    className={`w-full text-xs border rounded p-2 flex flex-row gap-2 items-center hover:bg-gray-100 transition ${openKey === key ? 'border-black' : 'border-gray-300'
                      }`}
                    onClick={() => setOpenKey(openKey === key ? null : key)}
                  >
                    <span
                      className="w-8 h-8 rounded-sm border mb-1"
                      style={{ background: customColors[key] }}
                    />
                    <span className="capitalize">{key}</span>
                  </button>

                  <AnimatePresence>
                    {openKey === key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <Tabs defaultValue={defaultTab} className="w-full mt-2">
                            <TabsList className="grid grid-cols-2 mb-2">
                              <TabsTrigger value="solid">Solid</TabsTrigger>
                              <TabsTrigger value="gradient">Gradient</TabsTrigger>
                            </TabsList>

                            <TabsContent value="solid">
                              <Input
                                type="color"
                                className="w-full h-10"
                                value={customColors[openKey]}
                                onChange={(e) =>
                                  setDesign((prev: UserProfile['design']) => ({
                                    ...prev,
                                    customColors: {
                                      ...prev.customColors,
                                      [openKey]: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </TabsContent>

                            <TabsContent value="gradient">
                              <GradientEditor
                                value={customColors[openKey]}
                                onChange={(val) =>
                                  setDesign((prev: UserProfile['design']) => ({
                                    ...prev,
                                    customColors: {
                                      ...prev.customColors,
                                      [openKey]: val,
                                    },
                                  }))
                                }
                              />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}