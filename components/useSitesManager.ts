import { useState, useEffect, useCallback } from 'react';
import { SITES } from '../constants';
import { SiteConfig, CategoryConfig, SitesData } from '../types';

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'AI', name: 'AI', name_zh: '人工智能', color: 'bg-purple-500' },
  { id: 'Search', name: 'Search', name_zh: '搜索引擎', color: 'bg-blue-500' },
  { id: 'Social', name: 'Social', name_zh: '社交媒体', color: 'bg-green-500' },
  { id: 'Media', name: 'Media', name_zh: '流媒体', color: 'bg-red-500' },
  { id: 'Dev', name: 'Dev', name_zh: '开发工具', color: 'bg-yellow-500' },
  { id: 'Other', name: 'Other', name_zh: '其他', color: 'bg-gray-500' }
];

const STORAGE_KEY = 'tonglema_custom_sites';
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
      // 确保数据结构完整性
      return {
        categories: data.categories || DEFAULT_CATEGORIES,
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
          setData({
            categories: imported.categories,
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
    importData
  };
}
