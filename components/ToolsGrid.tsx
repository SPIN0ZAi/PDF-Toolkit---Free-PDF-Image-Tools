'use client'

import Link from 'next/link'
import { tools, categories } from '@/lib/tools'
import * as Icons from 'lucide-react'
import { useState } from 'react'

export default function ToolsGrid() {
  const [filter, setFilter] = useState<'all' | 'pdf' | 'image' | 'conversion'>('all')
  
  const filteredTools = filter === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === filter)

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Tools
        </button>
        <button
          onClick={() => setFilter('pdf')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            filter === 'pdf'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          PDF Tools
        </button>
        <button
          onClick={() => setFilter('image')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            filter === 'image'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Image Tools
        </button>
        <button
          onClick={() => setFilter('conversion')}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            filter === 'conversion'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Conversion
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => {
          const IconComponent = (Icons as any)[tool.icon] || Icons.FileText
          const categoryInfo = categories[tool.category]
          
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-primary-500 ${
                tool.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              onClick={(e) => tool.comingSoon && e.preventDefault()}
            >
              {tool.popular && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  Popular
                </div>
              )}
              
              {tool.comingSoon && (
                <div className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  Soon
                </div>
              )}
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                  <IconComponent className="w-8 h-8 text-primary-600" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors">
                  {tool.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {tool.description}
                </p>
                
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${categoryInfo.color}`}>
                  {categoryInfo.name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
