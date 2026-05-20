import React, { useState, useEffect } from "react";

interface MilestoneFormProps {
  initialData?: {
    title?: string;
    plannedStart?: string;
    plannedEnd?: string;
    responsible?: string;
    teamName?: string;
    color?: string;
    projectId?: string;
    delayReason?: string;
    note?: string;
    subtitle?: string;
  };
  onSubmit: (data: {
    title: string;
    plannedStart: string;
    plannedEnd: string;
    responsible?: string;
    teamName?: string;
    color?: string;
    projectId?: string;
    delayReason?: string;
    note?: string;
    subtitle?: string;
  }) => void;
  onCancel?: () => void;
  projectOptions?: { id: string; name: string }[];
  isEdit?: boolean;
  submitLabel?: string;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  projectOptions = [],
  isEdit = false,
  submitLabel,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [plannedStart, setPlannedStart] = useState(initialData?.plannedStart || "");
  const [plannedEnd, setPlannedEnd] = useState(initialData?.plannedEnd || "");
  const [responsible, setResponsible] = useState(initialData?.responsible || "");
  const [teamName, setTeamName] = useState(initialData?.teamName || "");
  const [color, setColor] = useState(initialData?.color || "#2563eb");
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [delayReason, setDelayReason] = useState(initialData?.delayReason || "");
  const [note, setNote] = useState(initialData?.note || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setPlannedStart(initialData.plannedStart || "");
      setPlannedEnd(initialData.plannedEnd || "");
      setResponsible(initialData.responsible || "");
      setTeamName(initialData.teamName || "");
      setColor(initialData.color || "#2563eb");
      setProjectId(initialData.projectId || "");
      setDelayReason(initialData.delayReason || "");
      setNote(initialData.note || "");
      setSubtitle(initialData.subtitle || "");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      title, 
      plannedStart, 
      plannedEnd, 
      responsible: responsible || undefined,
      teamName: teamName || undefined,
      color: color || undefined,
      projectId: projectId || undefined,
      delayReason: delayReason || undefined,
      note: note || undefined,
      subtitle: subtitle || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Milestone Title *</label>
        <input
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter milestone title"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Planned Start *</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={plannedStart}
            onChange={e => setPlannedStart(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Planned End *</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={plannedEnd}
            onChange={e => setPlannedEnd(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Responsible</label>
          <input
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={responsible}
            onChange={e => setResponsible(e.target.value)}
            placeholder="Person responsible"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Team Name</label>
          <input
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Team name"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="border border-gray-300 rounded h-10 w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="#2563eb"
          />
        </div>
      </div>

      {!isEdit && projectOptions.length > 0 && (
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Project *</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            required
          >
            <option value="">Select Project</option>
            {projectOptions.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Subtitle (Optional)</label>
        <input
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder="Small text below milestone title in Gantt"
        />
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Delay Reason (Optional)</label>
        <textarea
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={delayReason}
          onChange={e => setDelayReason(e.target.value)}
          placeholder="Reason for any delays"
          rows={2}
        />
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Note (Optional)</label>
        <textarea
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Additional notes"
          rows={2}
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex-1"
        >
          {submitLabel || (isEdit ? "Update Milestone" : "Create Milestone")}
        </button>
      </div>
    </form>
  );
};

export default MilestoneForm;