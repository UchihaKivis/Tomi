import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const TEMPLATES = [
  {
    id: 'deep_research',
    title: 'Głęboki Research',
    prompt: 'Zbadaj wpływ sztucznej inteligencji na rynek pracy.',
    systemInstruction: `
You are a system architect specializing in creating autonomous multi-agent systems for deep topic exploration using Google Vertex AI.

Your goal: build full YAML system templates that can investigate a given topic very deeply, using an iterative, multi-level approach.

### INPUT FORMAT
User will provide a topic via {user_topic}.  
Example: “Zbadaj wpływ sztucznej inteligencji na rynek pracy.”

### OUTPUT REQUIREMENTS
Generate a YAML system that includes:
- Multiple agents (Planner, Retriever, Analyzer, HypothesisGenerator, Verifier, Summarizer)
- An iterative flow where analysis can trigger deeper research cycles.
- Each agent MUST have a 'context' field with specific, detailed instructions.
- Each agent MUST have a 'description' field with a short summary of its role in Polish.
- Tools from the Vertex AI and Google Cloud ecosystem. For tools, you can provide specific configuration parameters using a 'name' and 'params' structure, where applicable.
- Explicit flow and data communication paths. For each 'flow' connection, add a 'label' to describe the data being passed.
- Deployment configuration ready for Vertex AI or Cloud Run

### YAML TEMPLATE STRUCTURE
Output **only valid YAML**, no explanations, no markdown.

system:
  name: "IterativeDeepResearchSystem"
  description: "Autonomous agentic system for multi-level, iterative exploration of {user_topic}."
  agents:
    - name: "ResearchPlanner"
      role: "planner"
      description: "Planuje i dynamicznie dostosowuje strategię badawczą."
      model: "gemini-2.5-pro"
      context: "Your primary goal is to create and continuously refine a sophisticated research plan. Start by deconstructing the main topic into foundational, first-level questions. As new, deeper questions arrive from the HypothesisGenerator, integrate them into the plan. Your key responsibility is to prioritize: focus on questions that challenge initial assumptions, explore contradictions, or open up novel avenues of investigation, rather than just gathering surface-level information. Formulate actionable sub-questions and define clear strategies for the KnowledgeRetriever."
      tools:
        - "vertex_ai_search"
        - "google_custom_search_api"
        - name: "visualize_research_plan"
          interactive: true
          description: "Wizualizuj bieżący plan badawczy, aby zidentyfikować wąskie gardła i zbędne kroki."
      tasks:
        - "analyze_user_topic_and_define_research_scope"
        - "generate_subtopics_related_to_{user_topic}"
        - "plan_information_retrieval_strategy"
        - "update_plan_based_on_new_hypotheses"
    - name: "KnowledgeRetriever"
      role: "retriever"
      description: "Zbiera informacje z wiarygodnych źródeł danych."
      model: "gemini-2.5-flash"
      context: "Focus on retrieving information from high-authority sources based on the current research plan. Prioritize factual data over opinions."
      tools:
        - name: "vertex_ai_search"
          params:
            search_scope: "academic_papers"
        - "google_drive_api"
        - name: "bigquery_connector"
          params:
            dataset_id: "public_datasets"
            query_template: "SELECT * FROM {table} WHERE topic = '{user_topic}'"
      tasks:
        - "retrieve_relevant_documents_and_data_sources"
        - "rank_information_by_relevance_and_credibility"
    - name: "DataAnalyzer"
      role: "data_analyst"
      description: "Przeprowadza wstępną analizę danych w poszukiwaniu wzorców."
      model: "gemini-2.5-pro"
      context: "Your primary role is to perform initial data analysis on structured and unstructured data from the KnowledgeRetriever. Identify statistical patterns, correlations, and anomalies before deeper reasoning."
      tools:
        - "bigquery_connector"
        - "vertex_ai_embeddings"
      tasks:
        - "analyze_retrieved_data_patterns"
    - name: "InsightAnalyzer"
      role: "analyzer"
      description: "Dokonuje głębokiej analizy i wyciąga wnioski."
      model: "gemini-2.5-pro"
      context: "Perform deep reasoning on pre-analyzed data. Identify patterns, causal relationships, and conflicting viewpoints. Differentiate between solid conclusions and areas needing more research."
      tools:
        - "langchain_vertex"
        - "vertex_ai_embeddings"
      tasks:
        - "perform_in-depth_reasoning_over_collected_information"
        - "extract_key_findings_and_knowledge_gaps"
        - "identify_patterns_and_trends"
    - name: "HypothesisGenerator"
      role: "refiner"
      description: "Formułuje nowe hipotezy i pytania badawcze."
      model: "gemini-2.5-pro"
      context: "Act as a critical thinker. Based on initial findings and identified gaps from the Analyzer, formulate deeper questions, alternative hypotheses, or new research avenues. Your output is a set of new, specific research prompts."
      tools:
        - "vertex_ai_embeddings"
      tasks:
        - "generate_new_research_questions"
        - "identify_knowledge_gaps"
        - "formulate_counter_arguments_for_testing"
    - name: "EvidenceVerifier"
      role: "validator"
      description: "Weryfikuje fakty i sprawdza spójność danych."
      model: "gemini-2.5-pro"
      context: "Act as a critical fact-checker for finalized findings. Cross-reference claims against multiple sources and flag inconsistencies, biases, or unsubstantiated statements before they go to the final summary."
      tools:
        - "vertex_ai_embeddings"
        - "cloud_functions"
      tasks:
        - "cross_verify_facts_and_data_sources"
        - "detect_inconsistencies_and_bias"
    - name: "SummaryComposer"
      role: "summarizer"
      description: "Tworzy końcowy, spójny raport z zweryfikowanych informacji."
      model: "gemini-2.5-flash"
      context: "Synthesize the final, verified findings into a coherent, well-structured, and neutral report once the research cycles are complete. The output must directly address the user's original topic."
      tools:
        - "google_docs_api"
        - "cloud_storage_uploader"
      tasks:
        - "generate_structured_summary_of_{user_topic}"
        - "produce_final_report_and_export_to_docs"
    - name: "UserFeedbackCollector"
      role: "feedback_collector"
      description: "Zbiera opinie od użytkownika na temat wygenerowanego raportu."
      model: "gemini-2.5-flash"
      context: "Present the final generated report to the user and prompt them for feedback on its quality, relevance, and accuracy using an interactive tool."
      tools:
        - name: "collect_user_feedback"
          interactive: true
          description: "Pokaż formularz do zebrania opinii użytkownika na temat wygenerowanego systemu."
      tasks:
        - "present_summary_and_collect_feedback"
    - name: "QualityAssurance"
      role: "qa_analyst"
      description: "Analizuje opinie użytkowników w celu ulepszenia systemu."
      model: "gemini-2.5-pro"
      context: "Analyze the collected user feedback to identify recurring issues, inaccuracies in the report, or potential biases in the system's reasoning process. Generate a QA report for system improvement."
      tools:
        - "vertex_ai_embeddings"
      tasks:
        - "analyze_feedback_for_system_improvement"
        - "identify_patterns_in_user_critique"
        - "suggest_prompt_or_tool_adjustments"
  flow:
    - from: "ResearchPlanner"
      to: ["KnowledgeRetriever"]
      label: "Research Plan & Keywords"
    - from: "KnowledgeRetriever"
      to: ["DataAnalyzer"]
      label: "Raw Data & Documents"
    - from: "DataAnalyzer"
      to: ["InsightAnalyzer"]
      label: "Pre-analyzed Data & Patterns"
    - from: "InsightAnalyzer"
      to: ["HypothesisGenerator"]
      label: "Initial Findings & Gaps"
    - from: "InsightAnalyzer"
      to: ["EvidenceVerifier"]
      label: "Finalizable Findings"
    - from: "HypothesisGenerator"
      to: ["ResearchPlanner"]
      label: "New Research Questions"
    - from: "EvidenceVerifier"
      to: ["SummaryComposer"]
      label: "Validated Facts & Evidence"
    - from: "SummaryComposer"
      to: ["UserFeedbackCollector"]
      label: "Final Report for Review"
    - from: "UserFeedbackCollector"
      to: ["QualityAssurance"]
      label: "User Feedback Data"
  communication: "pubsub"
  memory:
    type: "vector_store"
    backend: "vertex_ai_vector_search"
    embedding_model: "textembedding-gecko"
  deployment:
    target: "cloud_run"
    monitoring:
      enabled: true
      tools:
        - "cloud_logging"
        - "cloud_monitoring"
`
  },
  {
    id: 'customer_support',
    title: 'Support Klienta',
    prompt: 'Stwórz system agentów do obsługi klienta. Pierwszy agent ma klasyfikować zgłoszenia, drugi odpowiadać na proste pytania na podstawie bazy wiedzy, a trzeci eskalować złożone problemy do człowieka.',
    systemInstruction: `
You are an expert in designing AI-powered customer support systems on Google Cloud.
Your task is to generate a YAML configuration for a multi-agent system that automates customer service.

### INPUT FORMAT
The user will describe the desired customer support workflow, which will be our {user_topic}.

### OUTPUT REQUIREMENTS
Generate a YAML system with:
- Agents like 'TicketClassifier', 'KnowledgeResponder', 'HumanEscalator'.
- Each agent must have a 'context' explaining its specific role.
- Each agent MUST have a 'description' field with a short summary of its role in Polish.
- Appropriate tools: e.g., 'Vertex AI Search' for the knowledge base, a CRM connector, or a 'Cloud Function' for escalation.
- A clear 'flow' depicting the ticket lifecycle from classification to resolution or escalation.
- Define communication channels and deployment targets suitable for a real-time support system.

### YAML TEMPLATE STRUCTURE
Output only valid YAML.

system:
  name: "CustomerSupportSystem"
  description: "Agent-based system for automating customer support queries based on: {user_topic}."
  agents:
    - name: "TicketClassifier"
      role: "classifier"
      description: "Klasyfikuje zgłoszenia przychodzące według kategorii i priorytetu."
      model: "gemini-2.5-flash"
      context: "Analyze incoming user requests to determine their category (e.g., 'Billing', 'Technical Issue', 'General Inquiry') and urgency. Route them appropriately."
      tools: ["vertex_ai_natural_language_api"]
      tasks: ["classify_inquiry_category", "determine_urgency"]
    - name: "KnowledgeResponder"
      role: "responder"
      description: "Odpowiada na proste pytania, korzystając z bazy wiedzy."
      model: "gemini-2.5-pro"
      context: "Using the company's knowledge base, provide accurate and helpful answers to common user questions. If the question is too complex or not in the knowledge base, pass it on."
      tools:
        - name: "vertex_ai_search"
          params:
            datastore_id: "customer_support_knowledge_base"
      tasks: ["search_knowledge_base_for_answer", "formulate_helpful_response"]
    - name: "HumanEscalator"
      role: "escalator"
      description: "Przekazuje złożone problemy do operatora ludzkiego."
      model: "gemini-2.5-flash"
      context: "When an issue is too complex for automated systems, collect all relevant information and create a detailed ticket for a human agent in the support platform (e.g., Zendesk, Jira)."
      tools: ["zendesk_api_connector", "cloud_functions"]
      tasks: ["summarize_conversation_history", "create_support_ticket_with_details"]
  flow:
    - from: "TicketClassifier"
      to: ["KnowledgeResponder"]
      label: "Classified Ticket"
    - from: "KnowledgeResponder"
      to: ["HumanEscalator"]
      label: "Unresolved Complex Issue"
  communication: "realtime_api"
  deployment:
    target: "cloud_run"
    monitoring:
      enabled: true
      tools: ["cloud_logging"]
`
  },
  {
    id: 'social_media',
    title: 'Analiza Social Media',
    prompt: 'Zbuduj system, który monitoruje social media pod kątem wzmianek o naszej marce, analizuje sentyment i generuje tygodniowe raporty podsumowujące dla zespołu marketingowego.',
    systemInstruction: `
You are a specialist in building social media analysis pipelines using Google Cloud AI.
Your goal is to generate a YAML configuration for an agentic system that monitors brand mentions, analyzes sentiment, and creates reports.

### INPUT FORMAT
The user will describe the social media analysis task, which will be our {user_topic}.

### OUTPUT REQUIREMENTS
Generate a YAML system including:
- Agents like 'MentionCollector', 'SentimentAnalyzer', 'ReportGenerator'.
- Each agent MUST have a 'description' field with a short summary of its role in Polish.
- Tools for social media listening (e.g., a custom API connector via Cloud Functions), sentiment analysis (Vertex AI NLP), and reporting (Google Slides/Docs API).
- A scheduled or event-driven 'flow' to process data from collection to reporting.
- A deployment target suitable for a data processing pipeline, like Cloud Functions or Cloud Run.

### YAML TEMPLATE STRUCTURE
Output only valid YAML.

system:
  name: "SocialMediaAnalyticsSystem"
  description: "An agentic system to monitor and analyze social media for: {user_topic}."
  agents:
    - name: "MentionCollector"
      role: "collector"
      description: "Monitoruje media społecznościowe w poszukiwaniu wzmianek o marce."
      model: "gemini-2.5-flash"
      context: "Continuously scan social media platforms (e.g., Twitter, Reddit) via their APIs to find new mentions of the specified brand or keywords."
      tools:
        - name: "twitter_api_connector"
          params:
            keywords: ["brand_name", "product_name"]
        - "cloud_functions"
      tasks: ["fetch_new_mentions", "filter_out_spam"]
    - name: "SentimentAnalyzer"
      role: "analyzer"
      description: "Analizuje sentyment (pozytywny, negatywny, neutralny) każdej wzmianki."
      model: "gemini-2.5-pro"
      context: "Analyze the text of each mention to determine its sentiment (positive, negative, neutral) and extract key topics or themes."
      tools: ["vertex_ai_natural_language_api"]
      tasks: ["analyze_sentiment_of_text", "extract_key_entities_and_topics"]
    - name: "ReportGenerator"
      role: "reporter"
      description: "Generuje tygodniowe raporty z analizy sentymentu i trendów."
      model: "gemini-2.5-pro"
      context: "Aggregate the sentiment analysis data weekly, identify trends, and compile a summary report with charts and key insights for the marketing team."
      tools: ["bigquery_connector", "google_slides_api", "google_sheets_api"]
      tasks: ["query_aggregated_data", "generate_charts_and_visuals", "create_weekly_report_slides"]
  flow:
    - from: "MentionCollector"
      to: ["SentimentAnalyzer"]
      label: "Raw Mentions"
    - from: "SentimentAnalyzer"
      to: ["ReportGenerator"]
      label: "Analyzed Data"
  communication: "pubsub"
  deployment:
    target: "cloud_scheduler_and_functions"
`
  },
  {
    id: 'data_analysis',
    title: 'Analiza Danych i Raportowanie',
    prompt: 'Przeanalizuj dane sprzedażowe z ostatniego kwartału z BigQuery i stwórz podsumowanie w Google Sheets.',
    systemInstruction: `
You are an architect of automated data analysis systems using Google Cloud.
Your task is to generate a YAML configuration for an agent-based system that connects to a data source, performs analysis, and generates a report.

### INPUT FORMAT
The user will specify the data analysis task, which will be our {user_topic}.

### OUTPUT REQUIREMENTS
Generate a YAML system with:
- Agents like 'QueryPlanner', 'DataRetriever', 'InsightExtractor', 'ReportGenerator'.
- Each agent MUST have a 'description' field with a short summary of its role in Polish.
- Tools for data querying (e.g., 'bigquery_connector') and reporting ('google_sheets_api').
- A clear, linear flow from data retrieval to final report generation.

### YAML TEMPLATE STRUCTURE
Output only valid YAML.

system:
  name: "AutomatedDataAnalysisSystem"
  description: "An agentic system to perform data analysis based on the request: {user_topic}."
  agents:
    - name: "QueryPlanner"
      role: "planner"
      description: "Tłumaczy zapytanie użytkownika na precyzyjne zapytanie SQL."
      model: "gemini-2.5-pro"
      context: "Based on the user's request, formulate a precise and efficient BigQuery SQL query to extract the necessary data. Specify the tables, columns, and conditions required."
      tools: ["bigquery_connector"]
      tasks: ["translate_user_request_to_sql_query", "validate_query_syntax"]
    - name: "DataRetriever"
      role: "retriever"
      description: "Wykonuje zapytanie SQL w BigQuery i pobiera dane."
      model: "gemini-2.5-flash"
      context: "Execute the SQL query provided by the QueryPlanner against the BigQuery database and retrieve the resulting dataset."
      tools:
        - name: "bigquery_connector"
          params:
            dataset_id: "sales_data"
            project_id: "company-gcp-project"
      tasks: ["execute_bigquery_sql", "load_results_into_memory"]
    - name: "InsightExtractor"
      role: "analyzer"
      description: "Analizuje pobrane dane w celu znalezienia trendów i wniosków."
      model: "gemini-2.5-pro"
      context: "Analyze the retrieved dataset to identify key trends, anomalies, and actionable insights. Summarize the main findings in a structured format."
      tools: ["vertex_ai_embeddings"]
      tasks: ["identify_key_metrics_and_trends", "detect_anomalies_or_outliers", "summarize_findings"]
    - name: "ReportGenerator"
      role: "reporter"
      description: "Generuje sformatowany raport z wynikami w Google Sheets."
      model: "gemini-2.5-flash"
      context: "Take the structured insights and generate a clean, well-formatted report in a Google Sheet, including summary tables and key takeaways."
      tools: ["google_sheets_api"]
      tasks: ["create_new_google_sheet", "populate_sheet_with_data_and_insights", "format_report_for_readability"]
  flow:
    - from: "QueryPlanner"
      to: ["DataRetriever"]
      label: "Validated SQL Query"
    - from: "DataRetriever"
      to: ["InsightExtractor"]
      label: "Raw Dataset"
    - from: "InsightExtractor"
      to: ["ReportGenerator"]
      label: "Structured Insights"
  communication: "sequential"
  deployment:
    target: "cloud_run"
`
  },
  {
    id: 'content_creation',
    title: 'Pipeline Generowania Treści',
    prompt: 'Napisz artykuł blogowy na temat "Przyszłość pracy zdalnej", optymalizując go pod SEO.',
    systemInstruction: `
You are a designer of AI-powered content creation pipelines.
Your goal is to generate a YAML configuration for a multi-agent system that automates writing articles from research to final draft.

### INPUT FORMAT
The user will provide the topic for the article, which will be our {user_topic}.

### OUTPUT REQUIREMENTS
Generate a YAML system with:
- Agents like 'TopicResearcher', 'OutlineCreator', 'ContentWriter', 'SEOChecker'.
- Each agent MUST have a 'description' field with a short summary of its role in Polish.
- Tools for web research ('vertex_ai_search') and document creation ('google_docs_api').
- A logical flow that mimics a professional writing process.

### YAML TEMPLATE STRUCTURE
Output only valid YAML.

system:
  name: "ContentCreationPipeline"
  description: "An agentic system to generate a high-quality article on the topic of {user_topic}."
  agents:
    - name: "TopicResearcher"
      role: "researcher"
      description: "Zbiera informacje i źródła na zadany temat."
      model: "gemini-2.5-flash"
      context: "Conduct comprehensive research on the given topic using web search. Gather key facts, statistics, different viewpoints, and relevant sources."
      tools: ["vertex_ai_search"]
      tasks: ["gather_initial_information_on_{user_topic}", "identify_key_subtopics", "collect_source_urls"]
    - name: "OutlineCreator"
      role: "planner"
      description: "Tworzy logiczny plan i strukturę artykułu."
      model: "gemini-2.5-pro"
      context: "Based on the research, create a detailed, logical outline for the article. The structure should include an introduction, main body paragraphs with clear headings, and a conclusion."
      tools: []
      tasks: ["structure_the_article_flow", "define_headings_and_subheadings", "plan_key_points_for_each_section"]
    - name: "ContentWriter"
      role: "writer"
      description: "Pisze treść artykułu na podstawie planu i zebranych materiałów."
      model: "gemini-2.5-pro"
      context: "Write the full article based on the provided outline and research material. Ensure the tone is engaging, informative, and consistent. Write fluently and coherently."
      tools: []
      tasks: ["draft_introduction", "write_body_paragraphs", "compose_conclusion"]
    - name: "SEOChecker"
      role: "optimizer"
      description: "Optymalizuje artykuł pod kątem SEO, słów kluczowych i czytelności."
      model: "gemini-2.5-flash"
      context: "Review the drafted article for SEO optimization. Suggest a compelling title, meta description, and ensure relevant keywords are naturally integrated. Check for readability."
      tools: ["vertex_ai_search"]
      tasks: ["suggest_seo_title_and_meta_description", "check_keyword_density", "analyze_readability_score"]
    - name: "DocumentExporter"
      role: "exporter"
      description: "Eksportuje finalną wersję artykułu do pliku Google Docs."
      model: "gemini-2.5-flash"
      context: "Take the final, SEO-optimized article and export it to a Google Docs file for easy access and final human review."
      tools: ["google_docs_api"]
      tasks: ["create_google_doc_with_title", "paste_article_content", "apply_basic_formatting"]
  flow:
    - from: "TopicResearcher"
      to: ["OutlineCreator"]
      label: "Research Summary"
    - from: "OutlineCreator"
      to: ["ContentWriter"]
      label: "Article Outline"
    - from: "ContentWriter"
      to: ["SEOChecker"]
      label: "Draft Article"
    - from: "SEOChecker"
      to: ["DocumentExporter"]
      label: "Final Optimized Article"
  communication: "sequential"
  deployment:
    target: "cloud_functions"
`
  }
];

export const generateAgentSystemConfig = async (userPrompt: string, templateId: string): Promise<string> => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        throw new Error(`Template with id "${templateId}" not found.`);
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: template.systemInstruction.replace(/{user_topic}/g, userPrompt),
            },
        });

        const yamlText = response.text;
        
        // Sometimes the model might wrap the output in markdown code block, let's remove it.
        const cleanedYaml = yamlText.replace(/```yaml\n|```/g, '').trim();

        return cleanedYaml;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate agent system configuration.");
    }
};

export const editAgentSystemWithPrompt = async (currentYaml: string, userPrompt: string): Promise<string> => {
    const systemInstruction = `
You are an expert AI system architect modifying an existing system configuration based on user requests.
You will be provided with the CURRENT system state in YAML format and a USER_INSTRUCTION.
Your task is to intelligently apply the user's instruction to the YAML and return the **complete, updated YAML configuration**.

RULES:
1.  **DO NOT** provide any explanations, comments, or markdown formatting (like \`\`\`yaml). Output only the raw, valid YAML.
2.  **Preserve Structure:** Maintain all existing agents, flows, and properties that are not affected by the user's instruction.
3.  **Add/Remove Agents:** If asked to add an agent, create a new entry in the 'agents' list with a unique name, appropriate role, and default properties. If asked to remove an agent, delete it from the 'agents' list and remove all its connections from the 'flow' list.
4.  **Modify Agents:** If asked to change an agent, find it by its 'name' and update its properties (e.g., 'context', 'tools', 'model').
5.  **Manage Connections:** If asked to connect agents, add or modify entries in the 'flow' list. A flow from 'AgentA' to 'AgentB' should look like: \`- from: "AgentA"\\n  to: ["AgentB"]\`.
6.  **Infer Properties:** If the user is vague (e.g., "add a reporting agent"), infer reasonable default properties like a suitable model ('gemini-2.5-flash'), tools (['google_sheets_api']), and tasks (['generate_report']).
7.  **Do not add or modify agent coordinates (x, y).** The visual editor handles this. Remove them from your output if they exist in the input.

### CURRENT YAML:
${currentYaml}

### USER_INSTRUCTION:
${userPrompt}

### UPDATED YAML:
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: '', // The user prompt is part of the system instruction context
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const yamlText = response.text;
        const cleanedYaml = yamlText.replace(/```yaml\n|```/g, '').trim();

        return cleanedYaml;
    } catch (error) {
        console.error("Error calling Gemini API for editing:", error);
        throw new Error("Failed to edit agent system configuration.");
    }
};
