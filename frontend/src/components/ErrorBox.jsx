import './ErrorBox.css';

export default function ErrorBox({ message }) {
  return (
    <div className="r-error">
      <span>⚠</span>
      <p>{message}</p>
    </div>
  );
}
