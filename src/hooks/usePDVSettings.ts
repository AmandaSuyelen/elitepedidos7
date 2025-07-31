import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PDVSettings {
  id?: string;
  scale_enabled: boolean;
  auto_print: boolean;
  sound_enabled: boolean;
  printer_paper_width: string;
  printer_font_size: number;
  printer_auto_adjust_font: boolean;
  printer_auto_adjust_paper: boolean;
  scale_port: string;
  scale_baud_rate: number;
  created_at?: string;
  updated_at?: string;
}

export function usePDVSettings() {
  const [settings, setSettings] = useState<PDVSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default settings
  const defaultSettings: Omit<PDVSettings, 'id' | 'created_at' | 'updated_at'> = {
    scale_enabled: true,
    auto_print: false,
    sound_enabled: true,
    printer_paper_width: '80mm',
    printer_font_size: 14,
    printer_auto_adjust_font: true,
    printer_auto_adjust_paper: true,
    scale_port: 'COM1',
    scale_baud_rate: 4800
  };

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pdv_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          scale_enabled: data.scale_enabled,
          auto_print: data.auto_print,
          sound_enabled: data.sound_enabled,
          printer_paper_width: data.printer_paper_width,
          printer_font_size: data.printer_font_size,
          printer_auto_adjust_font: data.printer_auto_adjust_font,
          printer_auto_adjust_paper: data.printer_auto_adjust_paper,
          scale_port: data.scale_port,
          scale_baud_rate: data.scale_baud_rate
        });
      } else {
        // Create default settings if none exist
        await createSettings(defaultSettings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Create settings
  const createSettings = async (newSettings: Omit<PDVSettings, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pdv_settings')
        .insert({
          scale_enabled: newSettings.scale_enabled,
          auto_print: newSettings.auto_print,
          sound_enabled: newSettings.sound_enabled,
          printer_paper_width: newSettings.printer_paper_width,
          printer_font_size: newSettings.printer_font_size,
          printer_auto_adjust_font: newSettings.printer_auto_adjust_font,
          printer_auto_adjust_paper: newSettings.printer_auto_adjust_paper,
          scale_port: newSettings.scale_port,
          scale_baud_rate: newSettings.scale_baud_rate
        })
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar configurações');
      throw err;
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<Omit<PDVSettings, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!settings?.id) return;

    try {
      const { data, error } = await supabase
        .from('pdv_settings')
        .update({
          scale_enabled: updates.scale_enabled,
          auto_print: updates.auto_print,
          sound_enabled: updates.sound_enabled,
          printer_paper_width: updates.printer_paper_width,
          printer_font_size: updates.printer_font_size,
          printer_auto_adjust_font: updates.printer_auto_adjust_font,
          printer_auto_adjust_paper: updates.printer_auto_adjust_paper,
          scale_port: updates.scale_port,
          scale_baud_rate: updates.scale_baud_rate
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configurações');
      throw err;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: loadSettings
  };
}