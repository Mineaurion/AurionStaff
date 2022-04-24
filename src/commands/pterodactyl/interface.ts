interface Attributes {
  server_owner: boolean;
  identifier: string;
  internal_id: number;
  uuid: string;
  name: string;
  node: string;
  description: string;
  invocation: string;
  docker_image: string;
  egg_features: string[];
  status: string;
  is_suspended: boolean;
  is_installing: boolean;
  is_transferring: boolean;
}

interface Data {
  object: string;
  attributes: Attributes;
}

interface Pagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  links: object;
}

interface Meta {
  pagination: Pagination;
}

export interface ServerListReponse {
  object: 'list';
  data: Data[];
  meta: Meta;
}

export interface ServerResources {
  object: 'stats';
  attributes: {
    current_state: 'offline' | 'starting' | 'running' | 'stopping';
    is_suspended: boolean;
    resources: {
      memory_bytes: number;
      cpu_absolute: number;
      disk_bytes: number;
      network_rx_bytes: number;
      network_tx_bytes: number;
      uptime: number;
    };
  };
}
