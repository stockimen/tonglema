import { useState, useEffect, useCallback } from 'react';
import { SITES } from '../constants';
import { SiteConfig, CategoryConfig, SitesData } from '../types';

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'AI', name: 'AI', name_zh: '人工智能' },
  { id: 'Search', name: 'Search', name_zh: '搜索引擎' },
  { id: 'Social', name: 'Social', name_zh: '社交媒体' },
  { id: 'Media', name: 'Media', name_zh: '流媒体' },
  { id: 'Dev', name: 'Dev', name_zh: '开发工具' },
  { id: 'Other', name: 'Other', name_zh: '其他' }
];

const STORAGE_KEY = 'tonglema_custom_sites';
const SYNC_SERVERS_KEY = 'tonglema_sync_servers';
const VERSION = 1;

/**
 * 从localStorage加载网站数据，如果没有则使用默认值
 */
function loadSitesData(): SitesData {
  if (typeof window === 'undefined') {
    return {
      categories: DEFAULT_CATEGORIES,
      sites: SITES,
      version: VERSION
    };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved) as SitesData;
      // 清理分类数据中的颜色字段，确保向后兼容
      const cleanedCategories = (data.categories || DEFAULT_CATEGORIES).map(cat => {
        const { color, ...cleanedCat } = cat;
        return cleanedCat;
      });
      // 确保数据结构完整性
      return {
        categories: cleanedCategories,
        sites: data.sites || [],
        version: data.version || VERSION
      };
    } catch (e) {
      console.error('Failed to parse saved sites data:', e);
    }
  }

  // 首次使用，导入默认数据
  const initialData: SitesData = {
    categories: DEFAULT_CATEGORIES,
    sites: SITES,
    version: VERSION
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
}

/**
 * 管理网站数据的自定义hook
 */
export function useSitesManager() {
  const [data, setData] = useState<SitesData>(loadSitesData);

  // 加载同步服务器列表
  const loadSyncServers = (): string[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(SYNC_SERVERS_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const [syncServers, setSyncServers] = useState<string[]>(loadSyncServers());

  // 自动保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  /**
   * 添加新分类
   */
  const addCategory = useCallback((category: Omit<CategoryConfig, 'id'>) => {
    const newCategory: CategoryConfig = {
      ...category,
      id: category.name.toUpperCase().replace(/\s+/g, '_')
    };

    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  }, []);

  /**
   * 编辑分类
   */
  const editCategory = useCallback((id: string, updates: Partial<CategoryConfig>) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      )
    }));
  }, []);

  /**
   * 删除分类（删除分类时，会将该分类下的网站移动到"Other"分类）
   */
  const deleteCategory = useCallback((id: string) => {
    setData(prev => {
      const hasOtherCategory = prev.categories.some(cat => cat.id === 'Other');
      const targetCategory = prev.categories.find(cat => cat.id === id);

      return {
        categories: prev.categories.filter(cat => cat.id !== id),
        sites: prev.sites.map(site =>
          site.category === id
            ? { ...site, category: hasOtherCategory ? 'Other' : (prev.categories[0]?.id || 'Other') }
            : site
        ),
        version: prev.version
      };
    });
  }, []);

  /**
   * 添加新网站
   */
  const addSite = useCallback((site: Omit<SiteConfig, 'id'>) => {
    const newSite: SiteConfig = {
      ...site,
      id: site.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    };

    setData(prev => ({
      ...prev,
      sites: [...prev.sites, newSite]
    }));
  }, []);

  /**
   * 编辑网站
   */
  const editSite = useCallback((id: string, updates: Partial<SiteConfig>) => {
    setData(prev => ({
      ...prev,
      sites: prev.sites.map(site =>
        site.id === id ? { ...site, ...updates } : site
      )
    }));
  }, []);

  /**
   * 删除网站
   */
  const deleteSite = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      sites: prev.sites.filter(site => site.id !== id)
    }));
  }, []);

  /**
   * 导入网站数据
   */
  const importSites = useCallback((newSites: SiteConfig[]) => {
    setData(prev => ({
      ...prev,
      sites: [...prev.sites, ...newSites.filter(
        newSite => !prev.sites.some(existing => existing.id === newSite.id || existing.url === newSite.url)
      )]
    }));
  }, []);

  /**
   * 重置为默认数据
   */
  const resetToDefault = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('确定要重置为默认数据吗？这将删除所有自定义的分类和网站。')) {
      const defaultData: SitesData = {
        categories: DEFAULT_CATEGORIES,
        sites: SITES,
        version: VERSION
      };
      setData(defaultData);
    }
  }, []);

  /**
   * 导出数据
   */
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tonglema-sites.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  /**
   * 导入数据
   */
  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as SitesData;
        if (imported.sites && imported.categories) {
          // 清理导入数据中的颜色字段
          const cleanedCategories = imported.categories.map(cat => {
            const { color, ...cleanedCat } = cat;
            return cleanedCat;
          });
          setData({
            categories: cleanedCategories,
            sites: imported.sites,
            version: imported.version || VERSION
          });
          if (typeof window !== 'undefined') {
            window.alert('数据导入成功！');
          }
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Failed to import data:', error);
        if (typeof window !== 'undefined') {
          window.alert('导入失败：数据格式不正确');
        }
      }
    };
    reader.readAsText(file);
  }, []);

  // 同步链接解析函数
  const parseSyncLink = (link: string) => {
    const match = link.match(/https:\/\/pb\.190699\.xyz\/(~?[^:]+):(.+)/);
    if (match) {
      return {
        downloadUrl: `https://pb.190699.xyz/${match[1]}`,
        managementUrl: link, // 完整的管理链接
        managementToken: match[2],
        id: match[1]
      };
    }
    return null;
  };

  // 数据格式转换函数：当前格式 -> 同步格式
  const convertToSyncFormat = (sitesData: SitesData) => {
    return {
      links: sitesData.sites.map(site => ({
        url: site.url,
        name: site.name,
        name_zh: site.name_zh || null,  // 使用null而不是undefined，保持一致性
        category: site.category,
        description: site.description || null,    // 分离存储description
        description_zh: site.description_zh || null,  // 分离存储description_zh
        iconUrl: site.iconUrl || null
      })),
      categories: sitesData.categories.reduce((acc, cat) => {
        acc[cat.id] = {
          name: cat.name,
          name_zh: cat.name_zh || null  // 使用null保持一致性
        };
        return acc;
      }, {})
    };
  };

  // 数据格式转换函数：同步格式 -> 当前格式
  const convertFromSyncFormat = (syncData: any): SitesData => {
    const sites: SiteConfig[] = (syncData.links || []).map((link: any) => ({
      id: link.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(), // 移除 index 后缀，使用URL生成唯一ID
      url: link.url,
      name: link.name || link.url,
      name_zh: link.name_zh || undefined,  // 恢复为undefined
      category: link.category || 'Other',
      description: link.description || undefined,  // 分离恢复description
      description_zh: link.description_zh || undefined,  // 分离恢复description_zh
      iconUrl: link.iconUrl || undefined
    }));

    const categories: CategoryConfig[] = Object.entries(syncData.categories || {}).map(([id, cat]: [string, any]) => ({
      id,
      name: cat.name,
      name_zh: cat.name_zh || undefined  // 恢复为undefined
    }));

    return {
      sites,
      categories,
      version: VERSION
    };
  };

  // 添加时间戳参数
  const addTimestamp = (url: string) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  };

  // 同步服务器管理
  const addSyncServer = useCallback((server: string) => {
    const servers = loadSyncServers();
    if (!servers.includes(server)) {
      servers.push(server);
      // 限制历史记录数量，最多保留10个
      if (servers.length > 10) {
        servers.splice(0, servers.length - 10);
      }
      localStorage.setItem(SYNC_SERVERS_KEY, JSON.stringify(servers));
      setSyncServers([...servers]);
    }
  }, []);

  const removeSyncServer = useCallback((server: string) => {
    const servers = loadSyncServers();
    const index = servers.indexOf(server);
    if (index > -1) {
      servers.splice(index, 1);
      localStorage.setItem(SYNC_SERVERS_KEY, JSON.stringify(servers));
      setSyncServers([...servers]);
    }
  }, []);

  // 创建同步链接
  const createSyncLink = useCallback(async (serverUrl: string) => {
    const syncData = convertToSyncFormat(data);
    const dataStr = JSON.stringify(syncData);

    const formData = new FormData();
    formData.append('c', dataStr);
    formData.append('e', ''); // 空字符串表示永不过期

    const response = await fetch(addTimestamp(`${serverUrl}/`), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`创建失败: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }, [data]);

  // 上传数据到服务器
  const uploadDataToServer = useCallback(async (managementUrl: string) => {
    const parsed = parseSyncLink(managementUrl);
    if (!parsed) {
      throw new Error('无效的管理链接格式');
    }

    const syncData = convertToSyncFormat(data);
    const dataStr = JSON.stringify(syncData);

    const formData = new FormData();
    formData.append('c', dataStr);

    const response = await fetch(addTimestamp(managementUrl), {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }
  }, [data]);

  // 从服务器下载数据
  const downloadDataFromServer = useCallback(async (syncUrl: string) => {
    let downloadEndpoint: string;

    const parsed = parseSyncLink(syncUrl);
    if (parsed) {
      downloadEndpoint = parsed.downloadUrl;
    } else {
      // 如果不是管理链接，假设是下载链接
      downloadEndpoint = syncUrl;
    }

    const response = await fetch(addTimestamp(downloadEndpoint));
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    const syncData = await response.json();
    const sitesData = convertFromSyncFormat(syncData);

    // 验证数据格式
    if (!Array.isArray(sitesData.sites) || !Array.isArray(sitesData.categories)) {
      throw new Error('无效的数据格式');
    }

    setData(sitesData);
  }, []);

  // 比较数据
  const compareDataWithServer = useCallback(async (syncUrl: string) => {
    let downloadEndpoint: string;

    const parsed = parseSyncLink(syncUrl);
    if (parsed) {
      downloadEndpoint = parsed.downloadUrl;
    } else {
      downloadEndpoint = syncUrl;
    }

    const response = await fetch(addTimestamp(downloadEndpoint));
    if (!response.ok) {
      throw new Error(`获取服务器数据失败: ${response.status}`);
    }

    const serverData = await response.json();
    const serverSitesData = convertFromSyncFormat(serverData);

    // 字段规范化函数
    const normalizeField = (field: any) => {
      return field || undefined; // 将null和空字符串都转换为undefined
    };

    const normalizeSite = (site: SiteConfig) => ({
      ...site,
      name_zh: normalizeField(site.name_zh),
      description: normalizeField(site.description),
      description_zh: normalizeField(site.description_zh),
      iconUrl: normalizeField(site.iconUrl)
    });

    // 计算差异 - 使用URL作为匹配标识符
    const differences = {
      localOnly: data.sites.filter(site =>
        !serverSitesData.sites.find(serverSite => serverSite.url === site.url)
      ),
      serverOnly: serverSitesData.sites.filter(site =>
        !data.sites.find(localSite => localSite.url === site.url)
      ),
      modified: []
    };

    // 检查修改的链接 - 使用规范化字段进行比较
    data.sites.forEach(localSite => {
      const serverSite = serverSitesData.sites.find(site => site.url === localSite.url);
      if (serverSite) {
        const normalizedLocal = normalizeSite(localSite);
        const normalizedServer = normalizeSite(serverSite);

        // 使用规范化字段进行比较
        const isModified =
          normalizeField(normalizedLocal.name) !== normalizeField(normalizedServer.name) ||
          normalizeField(normalizedLocal.name_zh) !== normalizeField(normalizedServer.name_zh) ||
          normalizeField(normalizedLocal.category) !== normalizeField(normalizedServer.category) ||
          normalizeField(normalizedLocal.description) !== normalizeField(normalizedServer.description) ||
          normalizeField(normalizedLocal.description_zh) !== normalizeField(normalizedServer.description_zh) ||
          normalizeField(normalizedLocal.iconUrl) !== normalizeField(normalizedServer.iconUrl);

        if (isModified) {
          differences.modified.push({
            url: localSite.url,
            local: normalizedLocal,
            server: normalizedServer
          });
        }
      }
    });

    return differences;
  }, [data]);

  return {
    data,
    sites: data.sites,
    categories: data.categories,
    addCategory,
    editCategory,
    deleteCategory,
    addSite,
    editSite,
    deleteSite,
    importSites,
    resetToDefault,
    exportData,
    importData,
    syncServers,
    addSyncServer,
    removeSyncServer,
    createSyncLink,
    uploadDataToServer,
    downloadDataFromServer,
    compareDataWithServer
  };
}
