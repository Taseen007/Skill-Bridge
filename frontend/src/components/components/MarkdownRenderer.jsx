import ReactMarkdown from "react-markdown"

const MarkdownRenderer = ({ content, className = "" }) => {
  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-900 mb-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-medium text-gray-900 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
          em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4" {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? 
              <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm" {...props} /> :
              <code className="block bg-gray-100 text-gray-800 p-3 rounded text-sm overflow-x-auto" {...props} />,
          pre: ({node, ...props}) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-4" {...props} />
        }}
      >
        {content || "No content available."}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
