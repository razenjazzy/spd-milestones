import React, { useState } from "react";

interface ProjectFormProps {
  initialData?: { name: string; description: string };
  onSubmit: (data: { name: string; description: string }) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSubmit }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <div>
        <label className="block font-semibold">Project Name</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block font-semibold">Description</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
};

export default ProjectForm;