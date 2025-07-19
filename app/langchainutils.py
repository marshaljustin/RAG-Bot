import re
import random
from typing import List, Dict
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from app.llm import initialize_huggingface_pipeline
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

def format_response(response: str) -> str:
    """Final formatting for LLM output with proper structure and emojis"""
    cleaned = re.sub(r'\s+', ' ', response).strip()
    cleaned = cleaned.replace("**", "").replace("__", "")
    
    lines = []
    prop_count = 1
    for line in cleaned.split('. '):
        line = line.strip().capitalize()
        
        if line.startswith("🏡"):
            lines.append(f"{prop_count}. {line}")
            prop_count += 1
        elif line.lower().startswith(("which", "would", "need", "want")):
            lines.append(f"\n{line}")
        else:
            lines.append(line)
    
    # Ensure ending prompt
    if not any(line.endswith('?') for line in lines[-2:]):
        lines.append("\nWould you like more details about any of these properties?")
    
    return '\n'.join(lines)

def enhance_results_with_langchain(results: List[Dict], query: str) -> str:
    """Main processing pipeline for property results"""
    if _is_pure_greeting(query):
        return _handle_greeting()
    
    target_bhk = _extract_bhk(query)
    target_loc = _extract_location(query)
    
    filtered = [
        prop for prop in results
        if _matches_bhk(prop, target_bhk) and
           _matches_location(prop, target_loc)
    ]
    
    if not filtered:
        return _no_results_response(query, target_bhk, target_loc)
    
    formatted_props = _format_properties(filtered)
    return _process_property_request(query, formatted_props, filtered)

def _extract_bhk(query: str) -> int:
    """Advanced BHK extraction with number normalization"""
    patterns = [
        r'\b(\d+)\s?(bhk|bedroom|bed)\b',
        r'\b(one|two|three|four|five)\s+(bhk|bedroom)\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            num = match.group(1)
            return _word_to_number(num) if num.isalpha() else int(num)
    return None

def _extract_location(query: str) -> str:
    """Location extraction with common landmarks handling"""
    query = query.lower()
    patterns = [
        r'\b(in|near|around|at|close to)\s+([\w\s]+?)(?=\s*\d|for|under|$)',
        r'\b(looking|searching|find).+?\s+in\s+([\w\s]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, query)
        if match:
            loc = match.group(2).strip()
            return _normalize_location(loc)
    return None

def _matches_bhk(prop: Dict, target_bhk: int) -> bool:
    """Flexible BHK matching with size normalization"""
    if not target_bhk:
        return True
    
    prop_size = str(prop.get('size', '')).lower()
    size_num = re.search(r'\d+', prop_size)
    return int(size_num.group()) == target_bhk if size_num else False

def _matches_location(prop: Dict, target_loc: str) -> bool:
    """Location matching with abbreviations support"""
    if not target_loc:
        return True
    
    prop_loc = str(prop.get('location', '')).lower()
    loc_variants = _get_location_variants(target_loc)
    return any(variant in prop_loc for variant in loc_variants)

def _format_properties(props: List[Dict]) -> str:
    """Uniform property formatting for LLM input"""
    formatted = []
    for prop in props:
        price = f"₹{prop['price']}L" if isinstance(prop['price'], (int, float)) else prop['price']
        size = f"{prop.get('sqft', '')} sqft" if prop.get('sqft') else prop.get('size', '')
        
        entry = (
            f"🏡 {price} | {prop['size']} BHK | {prop['location']} | "
            f"{size} | Amenities: {', '.join(prop.get('amenities', []))}"
        )
        formatted.append(entry)
    return '\n'.join(formatted)

def _process_property_request(query: str, formatted_props: str, raw_props: List[Dict]) -> str:
    """LLM processing with fallback handling"""
    try:
        llm = initialize_huggingface_pipeline()
        prompt = PROMPT_TEMPLATE.format(
            query=query,
            results=formatted_props
        )
        
        response = llm.text_generation(
            prompt,
            max_new_tokens=300,
            temperature=0.2,
            repetition_penalty=1.1
        )
        return _finalize_response(response, raw_props)
    except Exception as e:
        print(f"LLM Error: {e}")
        return _format_fallback_response(formatted_props, query)

def _finalize_response(response: str, props: List[Dict]) -> str:
    """Post-process LLM output with property validation"""
    # Ensure all properties are included
    present_ids = {prop['id'] for prop in props}
    response_ids = set(re.findall(r'ID: (\w+)', response))
    
    missing = present_ids - response_ids
    if missing:
        for pid in missing:
            response += f"\n🏡 {_get_property_summary(pid, props)}"
    
    return format_response(response)

def _get_property_summary(pid: str, props: List[Dict]) -> str:
    """Get short summary for missing properties"""
    prop = next(p for p in props if p['id'] == pid)
    return f"{prop['price']} | {prop['location']} | {prop['size']}"

def _no_results_response(query: str, bhk: int, loc: str) -> str:
    """Dynamic no-results suggestions"""
    base = "🔍 No properties found matching:"
    filters = []
    if bhk: filters.append(f"{bhk} BHK")
    if loc: filters.append(f"location '{loc}'")
    
    suggestions = [
        "Try adjusting your filters:",
        "- Consider nearby areas" if loc else "",
        "- Explore different BHK sizes" if bhk else "",
        "- Widen your price range"
    ]
    
    return "\n".join([
        f"{base} {', '.join(filters)}",
        *[s for s in suggestions if s],
        "\nNeed help refining your search? 🏡"
    ])

def _format_fallback_response(props: str, query: str) -> str:
    """Fallback when LLM fails"""
    header = "🏘 Available Properties:\n\n"
    return f"{header}{props}\n\n💡 Ask me about specific properties!"

# Location Helpers
LOCATION_MAP = {
    'blr': ['bangalore', 'bengaluru'],
    'mum': ['mumbai', 'bombay'],
    'hyd': ['hyderabad', 'secunderabad']
}

def _normalize_location(loc: str) -> str:
    """Convert common abbreviations to full names"""
    loc = loc.lower()
    for canonical, variants in LOCATION_MAP.items():
        if loc in variants or loc == canonical:
            return canonical
    return loc

def _get_location_variants(loc: str) -> List[str]:
    """Get all valid variants for a location"""
    return [loc] + LOCATION_MAP.get(loc, [])

def _word_to_number(word: str) -> int:
    """Convert word numbers to integers"""
    return {
        'one': 1, 'two': 2, 'three': 3,
        'four': 4, 'five': 5
    }.get(word.lower(), 0)

# Greeting Handling
def _is_pure_greeting(text: str) -> bool:
    """Detect greetings using expanded patterns"""
    pattern = r"^(hi+|hello|hey|greetings|good\s(morning|afternoon)|"
    pattern += r"welcome|h[ola]{2}|sup|howdy)[!\.\s]*$"
    return re.match(pattern, text.strip(), re.IGNORECASE)

def _handle_greeting() -> str:
    """Dynamic greeting responses"""
    return random.choice([
        "👋 Hi there! Ready to find your dream home?",
        "🏡 Welcome! Let's explore properties together!",
        "🌟 Good day! How can I assist with your home search?",
        "🤝 Hello! Ready to start your property journey?"
    ])

# Qdrant Results Processing
def process_qdrant_results(scored_points) -> List[Dict]:
    """Convert Qdrant results to standard format"""
    return [{
        'id': str(point.id),
        'price': point.payload.get('price', 0),
        'location': point.payload.get('location', 'Unknown'),
        'size': f"{point.payload.get('bedrooms', 0)} BHK",
        'sqft': point.payload.get('area_sqft', 0),
        'amenities': point.payload.get('amenities', [])
    } for point in scored_points]

# LangChain Pipeline Setup
PROMPT_TEMPLATE = PromptTemplate.from_template("""
[INST]
<<SYS>>
You are a real estate expert. Follow STRICT rules:
1. List ALL properties from <PROPERTIES> exactly
2. Use numbering with 🏡 emoji
3. Preserve prices/sizes exactly
4. Add ONE follow-up question
5. Never invent properties
<</SYS>

QUERY: {query}

PROPERTIES:
{results}

Generate helpful response:[/INST]
""")

def create_real_estate_chain(retriever, llm):
    """Full LangChain pipeline setup"""
    return RunnableSequence(
        {"query": RunnablePassthrough()} 
        | {
            "context": lambda x: enhance_results_with_langchain(
                process_qdrant_results(retriever(x["query"])),
                x["query"]
            ),
            "query": lambda x: x["query"]
        }
        | PROMPT_TEMPLATE
        | llm
        | StrOutputParser()
        | format_response
    )