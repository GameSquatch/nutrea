import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <ul>
        <li>
          <Link to="/basic">Basic</Link>
        </li>
        <li>
          <Link to="/virtualized">Virtualized</Link>
        </li>
        <li>
          <Link to="/edit_name">Edit Name</Link>
        </li>
        <li>
          <Link to="/key_navigation">Key Navigation</Link>
        </li>
        <li>
          <Link to="/drag_and_drop">Drag And Drop</Link>
        </li>
      </ul>
    </div>
  );
}
