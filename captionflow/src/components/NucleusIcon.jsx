export default function NucleusIcon(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 240 240"
            width={props.size || 240}
            height={props.size || 240}
            role="img"
            aria-label="Kjarni nucleus icon"
        >
            <defs>
                <style>{`
          .orbit { fill: none; stroke:#5b2334; stroke-width:6; stroke-linecap:round; stroke-linejoin:round; }
          .node { stroke:#5b2334; stroke-width:3; }
        `}</style>
            </defs>

            {/* Orbits */}
            <ellipse className="orbit" cx="120" cy="120" rx="78" ry="30" transform="rotate(0 120 120)" />
            <ellipse className="orbit" cx="120" cy="120" rx="78" ry="30" transform="rotate(60 120 120)" />
            <ellipse className="orbit" cx="120" cy="120" rx="78" ry="30" transform="rotate(-60 120 120)" />

            {/* Orbiting nodes */}
            <circle className="node" cx="62" cy="118" r="8" fill="#6fc3b8" />
            <circle className="node" cx="192" cy="86" r="8" fill="#d19b4a" />
            <circle className="node" cx="180" cy="174" r="8" fill="#d19b4a" />

            {/* Central nucleus */}
            <circle cx="120" cy="120" r="18" fill="#ff8a3c" />
            <circle cx="120" cy="120" r="9" fill="#ff4f1a" />
            <circle cx="120" cy="120" r="18" fill="none" stroke="#5b2334" strokeWidth="2" />
        </svg>
    );
}
