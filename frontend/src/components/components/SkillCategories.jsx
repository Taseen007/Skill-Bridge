"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const SkillCategories = ({ categories, selectedCategory, onCategorySelect }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [collapsedHeight, setCollapsedHeight] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    // Check if content exceeds one line
    const checkHeight = () => {
      if (containerRef.current) {
        const container = containerRef.current
        
        // Temporarily expand to measure full height
        const originalMaxHeight = container.style.maxHeight
        const originalOverflow = container.style.overflow
        container.style.maxHeight = 'none'
        container.style.overflow = 'visible'
        
        const fullHeight = container.scrollHeight
        
        // Calculate height for exactly 1 complete line
        // Get the first button to measure actual line height
        const firstButton = container.querySelector('button')
        if (firstButton) {
          const buttonHeight = firstButton.offsetHeight
          const oneLineHeight = buttonHeight // Just one row height
          
          setCollapsedHeight(oneLineHeight)
          setShowExpandButton(fullHeight > oneLineHeight)
        }
        
        // Restore original styles
        container.style.maxHeight = originalMaxHeight
        container.style.overflow = originalOverflow
      }
    }

    // Check height after categories load
    if (categories.length > 0) {
      setTimeout(checkHeight, 100)
    }
  }, [categories])

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Browse by Tags</h3>
      <div className="relative">
        <div 
          ref={containerRef}
          className={`flex flex-wrap gap-3 transition-all duration-300 overflow-hidden`}
          style={{
            maxHeight: !isExpanded && showExpandButton ? `${collapsedHeight}px` : 'none'
          }}
        >
          <button
            onClick={() => onCategorySelect("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Skills
          </button>
          {categories.map((category) => (
            <button
              key={category.tag}
              onClick={() => onCategorySelect(category.tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category.tag
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{category.tag}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                selectedCategory === category.tag
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
        
        {/* Expand/Collapse Button */}
        {showExpandButton && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Show More</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SkillCategories
