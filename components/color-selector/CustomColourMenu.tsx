import { ChevronDown } from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/Input'
import { GradientEditor } from './GradientEditor'
import * as Popover from '@radix-ui/react-popover'

export function CustomColorMenu({
  design,
  setDesign,
}: {
  design: any
  setDesign: (cb: any) => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  const isSelected = design.theme === 'custom'

  const customColors = useMemo(() => {
    return (
      design.customColors || {
        background: '#ffffff',
        surface: '#f4f4f4',
        accent: '#3b82f6',
      }
    )
  }, [design.customColors])

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          onClick={() => {
            if (design.theme !== 'custom') {
              setDesign((prev: any) => ({
                ...prev,
                theme: 'custom',
                customColors,
              }))
            }
          }}
          className={`relative border rounded-md p-1 w-full group transition-all duration-300 h-[110px] ${isSelected ? 'border-black shadow-md bg-gray-50' : 'border-gray-200'
            }`}
        >

          {/* Color dots stacked */}
          <div className="relative h-6 w-6 mx-auto mt-1 flex justify-center">
            {[customColors.surface, customColors.background, customColors.accent].map(
              (c, i) => (
                <span
                  key={i}
                  className="absolute w-6 h-6 border border-gray-400 rounded-full transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: c,
                    transform: `translateX(${i * 8}px)`,
                    zIndex: 10 + i,
                  }}
                />
              )
            )}
          </div>
          <span className="block text-xs mt-6 font-medium">Custom</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal forceMount>
        <Popover.Content
          side="bottom"
          align="start"
          className="z-50 mt-2 w-[280px] outline-none"
        >
          <motion.div
            className="border rounded-md bg-white shadow p-4 grid gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col gap-2">
              {['background', 'surface', 'accent'].map((key) => (
                <button
                  key={key}
                  className={`flex-1 text-xs border rounded p-2 flex flex-row gap-2 items-center hover:bg-gray-100 transition ${openKey === key ? 'border-black' : 'border-gray-300'
                    }`}
                  onClick={() => setOpenKey(openKey === key ? null : key)}
                >
                  <span
                    className="w-8 h-8 rounded-sm border mb-1"
                    style={{ background: customColors[key] }}
                  />
                  {key}
                </button>
              ))}
            </div>

            {openKey && (
              <Tabs defaultValue="solid" className="w-full">
                <TabsList className="grid grid-cols-2 mb-2 mt-2">
                  <TabsTrigger value="solid">Solid</TabsTrigger>
                  <TabsTrigger value="gradient">Gradient</TabsTrigger>
                </TabsList>

                <TabsContent value="solid">
                  <Input
                    type="color"
                    className="w-full h-10"
                    value={customColors[openKey]}
                    onChange={(e) =>
                      setDesign((prev: any) => ({
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
                      setDesign((prev: any) => ({
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
            )}
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
