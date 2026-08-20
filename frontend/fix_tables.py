import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add remarkGfm import
if "import remarkGfm" not in content:
    content = content.replace("import ReactMarkdown from \"react-markdown\";", "import ReactMarkdown from \"react-markdown\";\nimport remarkGfm from \"remark-gfm\";")

# 2. Add remarkPlugins and table components to ReactMarkdown
bad_markdown = """                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p style={{ marginBottom: "0.75em" }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ listStyleType: "disc", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ listStyleType: "decimal", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        li: ({node, ...props}) => <li {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }} {...props} />,
                      }}
                    >"""

good_markdown = """                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{ marginBottom: "0.75em" }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ listStyleType: "disc", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ listStyleType: "decimal", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        li: ({node, ...props}) => <li {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }} {...props} />,
                        table: ({node, ...props}) => <div style={{ overflowX: "auto", marginBottom: "1em" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} {...props} /></div>,
                        thead: ({node, ...props}) => <thead style={{ backgroundColor: "var(--color-surface)", borderBottom: "2px solid var(--color-border)" }} {...props} />,
                        tbody: ({node, ...props}) => <tbody {...props} />,
                        tr: ({node, ...props}) => <tr style={{ borderBottom: "1px solid var(--color-border)" }} {...props} />,
                        th: ({node, ...props}) => <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--color-navy)" }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: "8px 12px", color: "var(--color-text-primary)" }} {...props} />,
                      }}
                    >"""
content = content.replace(bad_markdown, good_markdown)

# 3. Change input div to form to handle Enter key properly
bad_input = """      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Ask anything about journey drop-offs, PA processing times, or risk triage..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 13,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--control-radius)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || isTyping}
          style={{
            padding: "0 20px",
            opacity: !inputQuery.trim() || isTyping ? 0.5 : 1,
          }}
        >
          <Send size={14} />
          <span>Send Inquiry</span>
        </button>
      </div>"""

good_input = """      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: "flex", gap: 10, flexShrink: 0 }}
      >
        <input
          type="text"
          placeholder="Ask anything about journey drop-offs, PA processing times, or risk triage..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 13,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--control-radius)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!inputQuery.trim() || isTyping}
          style={{
            padding: "0 20px",
            opacity: !inputQuery.trim() || isTyping ? 0.5 : 1,
          }}
        >
          <Send size={14} />
          <span>Send Inquiry</span>
        </button>
      </form>"""
content = content.replace(bad_input, good_input)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
