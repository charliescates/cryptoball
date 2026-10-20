import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export const HundredClub: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app"></div>
    </DndProvider>
  );
};