"use client"

import { DollarSign, Star, Award, MapPin, Clock } from "lucide-react"

const FilterSidebar = ({ filters, onFiltersChange, priceCeiling = 5000 }) => {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }
  const sliderValue = Math.min(filters.maxPrice, priceCeiling)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900"><MapPin className="h-4 w-4" />Location</h3>
        <input value={filters.location} onChange={(e) => updateFilter("location", e.target.value)} placeholder="City or area" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        <p className="text-xs text-gray-400 mt-1">Matches the teacher's profile location — set under Profile → Edit.</p>
      </div>
      <label className="bg-white rounded-lg shadow-md p-4 flex items-center gap-2 text-sm font-medium text-gray-900"><Clock className="h-4 w-4" /><input type="checkbox" checked={filters.availableNow} onChange={(e) => updateFilter("availableNow", e.target.checked)} />Available slots only</label>
      {/* Price Range */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <DollarSign className="h-4 w-4" />
          Price Range
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Up to ৳{sliderValue}/session</label>
            <input
              type="range"
              min="0"
              max={priceCeiling}
              step="50"
              value={sliderValue}
              onChange={(e) => updateFilter("maxPrice", Number.parseInt(e.target.value))}
              className="w-full mt-2"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>৳0</span>
            <span>৳{priceCeiling}+</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <Star className="h-4 w-4" />
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {[4, 3, 2, 1, 0].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={filters.minRating === rating}
                onChange={() => updateFilter("minRating", rating)}
                className="text-blue-600"
              />
              <span className="flex items-center gap-1 text-sm">
                {rating > 0 ? (
                  <>
                    {rating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </>
                ) : (
                  "Any rating"
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Proficiency Level Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <Award className="h-4 w-4" />
          Proficiency Level
        </h3>
        <div className="space-y-2">
          {[
            { value: "any", label: "Any Level" },
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="proficiency"
                value={option.value}
                checked={filters.proficiency === option.value}
                onChange={() => updateFilter("proficiency", option.value)}
                className="text-blue-600"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FilterSidebar
