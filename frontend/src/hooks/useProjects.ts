import { useEffect, useState } from "react";
import api from "../api/api";
import { logger } from "../utils/logger";

export interface Project {
  _id: string;
  name: string;
  description?: string;   // optional
  createdAt?: string;     // optional
  milestones?: any[];     // optional
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.debug('useProjects: Fetching projects');
    
    api.get("/projects")
      .then(res => {
        setProjects(res.data);
        logger.info('Projects loaded successfully', { count: res.data.length });
      })
      .catch(err => {
        setError(err.message);
        logger.error('Failed to load projects', err);
      })
      .finally(() => {
        setLoading(false);
        logger.debug('useProjects: Loading complete');
      });
  }, []);

  return { projects, loading, error };
}
