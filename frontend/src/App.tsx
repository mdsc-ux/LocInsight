import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';

// ============================================================================
// TIPAGENS DO PRISMA / POSTGRESQL (DEFINIDAS LOCALMENTE PARA EVITAR CONFLITO)
// ============================================================================
export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  status: 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO';
  serialNumber: string;
  quantity: number;
  manualUrl?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  points: number;
  createdAt?: string;
}

export interface Rental {
  id: string;
  startDate: string;
  expectedReturn: string;
  actualReturn?: string | null;
  status: 'ACTIVE' | 'FINISHED';
  userId: string;
  user?: User;
  equipmentId: string;
  equipment?: Equipment;
  conditionOnReturn?: string | null;
  pointsEarned: number;
}

export interface Maintenance {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  type: string;
  cost: number;
  startDate: string;
  endDate?: string | null;
  description: string;
  partsReplaced?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// ÍCONES SVG INLINE (ZERO DEPENDÊNCIAS, RENDERIZAÇÃO PERFEITA)
// ============================================================================
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="10" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>;
const IconCatalog = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10" /><path d="M6 10h10" /></svg>;
const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#F27A22" stroke="#F27A22" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>;
const IconWhatsApp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.463h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
function App() {
  // ============================================================================
  // ESTADOS DE NAVEGAÇÃO E AUTENTICAÇÃO
  // ============================================================================
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('locinsight_user');
    return saved ? JSON.parse(saved) : null;
  });
  const currentUserRef = useRef<User | null>(currentUser);
  currentUserRef.current = currentUser;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog'>('catalog');
  const [adminTab, setAdminTab] = useState<'rentals' | 'equipments' | 'maintenances' | 'categories' | 'users'>('rentals');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Controla exibição da landing page (tela inicial)
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    const saved = localStorage.getItem('locinsight_user');
    return !saved; // Mostra landing se não há usuário salvo
  });

  // ============================================================================
  // ESTADOS DE DADOS (DASHBOARD & CATÁLOGO)
  // ============================================================================
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filtros do Catálogo
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Estados de Controle de UX
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============================================================================
  // ESTADOS PARA FORMULÁRIOS & MODAIS
  // ============================================================================
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddRentalModal, setShowAddRentalModal] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null); // rentalId
  const [showFinishMaintenanceModal, setShowFinishMaintenanceModal] = useState<string | null>(null); // maintenanceId
  const [showUpsellModal, setShowUpsellModal] = useState<Equipment | null>(null);

  // Form de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form de Equipamento (Cadastro)
  const [eqName, setEqName] = useState('');
  const [eqSerial, setEqSerial] = useState('');
  const [eqCategory, setEqCategory] = useState('');
  const [eqDescription, setEqDescription] = useState('');
  const [eqQuantity, setEqQuantity] = useState('1');
  const manualInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form de Equipamento (Edição)
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editEqName, setEditEqName] = useState('');
  const [editEqSerial, setEditEqSerial] = useState('');
  const [editEqCategory, setEditEqCategory] = useState('');
  const [editEqDescription, setEditEqDescription] = useState('');
  const [editEqQuantity, setEditEqQuantity] = useState('1');
  const [editEqStatus, setEditEqStatus] = useState<'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO'>('DISPONIVEL');
  const editManualInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Form de Categoria
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form de Locação
  const [rentalEqId, setRentalEqId] = useState('');
  const [rentalClientName, setRentalClientName] = useState('');
  const [rentalClientEmail, setRentalClientEmail] = useState('');
  const [rentalExpectedReturn, setRentalExpectedReturn] = useState('');

  // Form de Manutenção
  const [maintEqId, setMaintEqId] = useState('');
  const [maintType, setMaintType] = useState('PREVENTIVA');
  const [maintCost, setMaintCost] = useState('0');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintParts, setMaintParts] = useState('');

  // Form de Finalizar Manutenção
  const [finishMaintCost, setFinishMaintCost] = useState('0');
  const [finishMaintParts, setFinishMaintParts] = useState('');

  // Form de Resgate de Pontos (Cliente)
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(10);

  // Form de Novo Usuário (Admin)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'CLIENT'>('CLIENT');
  const [newUserPassword, setNewUserPassword] = useState('');

  // ============================================================================
  // CARREGAMENTO DE DADOS DO BACKEND
  // ============================================================================
  const loadAllData = async () => {
    const userAtStart = currentUserRef.current;
    setLoading(true);
    try {
      const isAdmin = userAtStart?.role === 'ADMIN';
      const eqData = await api.getEquipments(isAdmin ? {} : { public: true });
      if (currentUserRef.current?.id !== userAtStart?.id) return;
      setEquipments(eqData);

      const catData = await api.getCategories();
      if (currentUserRef.current?.id !== userAtStart?.id) return;
      setCategories(catData);

      if (userAtStart) {
        if (isAdmin) {
          // Dados Administrativos adicionais
          const rentalsData = await api.getRentals();
          if (currentUserRef.current?.id !== userAtStart.id) return;
          setRentals(rentalsData);

          const maintData = await api.getMaintenances();
          if (currentUserRef.current?.id !== userAtStart.id) return;
          setMaintenances(maintData);

          const usersData = await api.getUsers();
          if (currentUserRef.current?.id !== userAtStart.id) return;
          setUsers(usersData);
        } else {
          // Dados específicos do Cliente logado (Histórico, Pontos, etc.)
          const clientDetails = await api.getClientById(userAtStart.id);
          if (currentUserRef.current?.id !== userAtStart.id) return;
          setRentals(clientDetails.rentals || []);

          // Atualizar pontos do cliente na sessão caso tenha mudado
          if (currentUserRef.current && currentUserRef.current.points !== clientDetails.points) {
            const updatedUser = { ...currentUserRef.current, points: clientDetails.points };
            setCurrentUser(updatedUser);
            localStorage.setItem('locinsight_user', JSON.stringify(updatedUser));
          }
        }
      }
    } catch (err: any) {
      if (currentUserRef.current?.id === userAtStart?.id) {
        triggerError(err.message || 'Erro ao carregar dados do servidor');
      }
    } finally {
      if (currentUserRef.current?.id === userAtStart?.id) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Auxiliares de Notificação
  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // ============================================================================
  // PROCESSOS DE AUTENTICAÇÃO (LOGIN / LOGOUT / SEED)
  // ============================================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    try {
      const user = await api.login(loginEmail, loginPassword);
      setCurrentUser(user);
      localStorage.setItem('locinsight_user', JSON.stringify(user));
      setShowLoginModal(false);
      if (user.role === 'ADMIN') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('catalog');
      }
      triggerSuccess(`Bem-vindo, ${user.name}!`);
    } catch (err: any) {
      triggerError(err.message || 'Dados de login inválidos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('locinsight_user');
    setRentals([]);
    setEquipments([]);
    setCategories([]);
    setMaintenances([]);
    setActiveTab('catalog');
  };

  // Atalhos de Login Rápido de Teste (PB01 / PB02 / DoD validations)
  const loginQuickly = (role: 'ADMIN' | 'CLIENT') => {
    if (role === 'ADMIN') {
      setLoginEmail('admin@locinsight.com');
      setLoginPassword('senha123_criptografada');
    } else {
      setLoginEmail('jose@construtorasilva.com');
      setLoginPassword('jose123');
    }
  };

  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      const res = await api.seed();
      triggerSuccess(res.message || 'Banco semeado com sucesso!');
      if (currentUser) {
        await loadAllData();
      }
    } catch (err: any) {
      triggerError(err.message || 'Erro ao semear o banco');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // SUBMISSÃO DE FORMULÁRIOS & AÇÕES DO BACKEND
  // ============================================================================

  // 1. Criar Equipamento (PB01)
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName || !eqCategory || !eqSerial) {
      triggerError('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const formData = new FormData();
    formData.append('name', eqName);
    formData.append('serialNumber', eqSerial);
    formData.append('categoryId', eqCategory);
    formData.append('description', eqDescription);
    formData.append('quantity', eqQuantity);

    const manualFile = manualInputRef.current?.files?.[0];
    const imageFile = imageInputRef.current?.files?.[0];

    // RN05: Manual PDF é obrigatório
    if (manualFile) {
      formData.append('manual', manualFile);
    } else {
      triggerError('O manual técnico em PDF é obrigatório para cadastrar o equipamento.');
      return;
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    try {
      await api.createEquipment(formData);
      triggerSuccess('Equipamento cadastrado com sucesso!');
      setShowAddEquipmentModal(false);

      // Limpar campos
      setEqName('');
      setEqSerial('');
      setEqCategory('');
      setEqDescription('');
      setEqQuantity('1');

      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao cadastrar equipamento');
    } finally {
      setLoading(false);
    }
  };

  // Excluir Equipamento
  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este equipamento e todo o seu histórico?')) return;
    setLoading(true);
    try {
      await api.deleteEquipment(id);
      triggerSuccess('Equipamento removido com sucesso!');
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao remover equipamento');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de Edição preenchido
  const openEditModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEditEqName(eq.name);
    setEditEqSerial(eq.serialNumber);
    setEditEqCategory(eq.categoryId);
    setEditEqDescription(eq.description || '');
    setEditEqQuantity(String(eq.quantity));
    setEditEqStatus(eq.status);
    setShowEditEquipmentModal(true);
  };

  // Editar Equipamento (Atualizar Ativo)
  const handleEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    if (!editEqName || !editEqCategory || !editEqSerial) {
      triggerError('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const formData = new FormData();
    formData.append('name', editEqName);
    formData.append('serialNumber', editEqSerial);
    formData.append('categoryId', editEqCategory);
    formData.append('description', editEqDescription);
    formData.append('quantity', editEqQuantity);
    formData.append('status', editEqStatus);

    const manualFile = editManualInputRef.current?.files?.[0];
    const imageFile = editImageInputRef.current?.files?.[0];

    // Obs: Arquivos são opcionais na atualização
    if (manualFile) {
      formData.append('manual', manualFile);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    try {
      await api.updateEquipment(editingEquipment.id, formData);
      triggerSuccess('Equipamento atualizado com sucesso!');
      setShowEditEquipmentModal(false);
      setEditingEquipment(null);
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao atualizar equipamento');
    } finally {
      setLoading(false);
    }
  };

  // 1b. Criar Usuário (Admin)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      triggerError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword
      });
      triggerSuccess('Usuário cadastrado com sucesso!');
      setShowAddUserModal(false);

      // Limpar campos
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('CLIENT');
      setNewUserPassword('');

      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  // 2. Criar Categoria
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setLoading(true);
    try {
      await api.createCategory(newCategoryName);
      triggerSuccess('Categoria criada com sucesso!');
      setNewCategoryName('');
      setShowAddCategoryModal(false);
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  // 3. Abrir Locação
  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalEqId || !rentalExpectedReturn || !rentalClientEmail || !rentalClientName) {
      triggerError('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      await api.createRental({
        equipmentId: rentalEqId,
        expectedReturn: rentalExpectedReturn,
        clientName: rentalClientName,
        clientEmail: rentalClientEmail
      });
      triggerSuccess('Locação realizada com sucesso!');
      setShowAddRentalModal(false);
      // Limpar formulário
      setRentalEqId('');
      setRentalExpectedReturn('');
      setRentalClientName('');
      setRentalClientEmail('');
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao criar locação');
    } finally {
      setLoading(false);
    }
  };

  // 4. Registrar Devolução / Checklist (RN03 / RN04)
  const handleReturnRental = async (condition: 'BOM' | 'DANIFICADO') => {
    if (!showReturnModal) return;
    setLoading(true);
    try {
      const res = await api.returnRental(showReturnModal, condition);
      if (condition === 'BOM') {
        triggerSuccess(`Equipamento devolvido! Cliente recebeu +${res.pointsEarned} pontos de fidelidade.`);
      } else {
        triggerWarning(`Equipamento danificado registrado. Enviado automaticamente para Manutenção Corretiva.`);
      }
      setShowReturnModal(null);
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao processar devolução');
    } finally {
      setLoading(false);
    }
  };

  const triggerWarning = (msg: string) => {
    setErrorMessage(msg); // Usamos o toast de erro com banner personalizado para alertas
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // 5. Registrar Manutenção (RN06)
  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintEqId || !maintDescription) {
      triggerError('Campos obrigatórios: Equipamento e Descrição.');
      return;
    }
    setLoading(true);
    try {
      await api.createMaintenance({
        equipmentId: maintEqId,
        type: maintType,
        cost: Number(maintCost),
        description: maintDescription,
        partsReplaced: maintParts || undefined
      });
      triggerSuccess('Equipamento enviado para manutenção!');
      setShowAddMaintenanceModal(false);
      // Limpar
      setMaintEqId('');
      setMaintDescription('');
      setMaintParts('');
      setMaintCost('0');
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao registrar manutenção');
    } finally {
      setLoading(false);
    }
  };

  // 6. Concluir Manutenção
  const handleFinishMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFinishMaintenanceModal) return;
    setLoading(true);
    try {
      await api.finishMaintenance(showFinishMaintenanceModal, {
        cost: Number(finishMaintCost),
        partsReplaced: finishMaintParts || undefined
      });
      triggerSuccess('Manutenção concluída! Equipamento de volta ao status "Disponível".');
      setShowFinishMaintenanceModal(null);
      setFinishMaintCost('0');
      setFinishMaintParts('');
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao finalizar manutenção');
    } finally {
      setLoading(false);
    }
  };

  // 7. Resgate de Pontos (PB14)
  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || pointsToRedeem <= 0) return;
    if (currentUser.points < pointsToRedeem) {
      triggerError('Você não possui pontos suficientes para esse resgate.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.redeemPoints(currentUser.id, pointsToRedeem);
      triggerSuccess(`Sucesso! Resgatado R$ ${res.discountValue.toFixed(2)} de desconto na próxima locação.`);

      // Atualizar dados de usuário logado
      const updated = { ...currentUser, points: res.remainingPoints };
      setCurrentUser(updated);
      localStorage.setItem('locinsight_user', JSON.stringify(updated));
      loadAllData();
    } catch (err: any) {
      triggerError(err.message || 'Erro ao resgatar pontos');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // GERAÇÃO DE MENSAGEM DO WHATSAPP (PB06 - CHECKOUT) & UPSELL (SKILL OPERACIONAL)
  // ============================================================================
  const handleRequestWhatsAppCheckout = (eq: Equipment) => {
    if (!currentUser) {
      triggerError('Você precisa fazer login para solicitar a locação via WhatsApp.');
      setShowLoginModal(true);
      return;
    }
    // Abrir modal de Upsell primeiro
    setShowUpsellModal(eq);
  };

  const handleConfirmWhatsAppRental = (eq: Equipment, addExtra: boolean) => {
    setShowUpsellModal(null);

    // Sugestão de Upsell baseada na Skill Operacional (skill-principal.md)
    let upsellSuggestion = "";
    if (addExtra) {
      if (eq.name.toLowerCase().includes('betoneira') || eq.name.toLowerCase().includes('andaime')) {
        upsellSuggestion = "\n- Cabo de Extensão Elétrica Reforçado (15m)\n- Kit EPI Básico (Capacete, Luvas, Óculos)";
      } else if (eq.name.toLowerCase().includes('gerador')) {
        upsellSuggestion = "\n- Galão de Combustível Reserva (10L)\n- Mangueira Compressor de Alta Pressão";
      } else {
        upsellSuggestion = "\n- Kit de Acessórios e Peças Sobressalentes";
      }
    }

    const clientPhone = "(11) 99999-9999"; // Fictício
    const message = `Olá, Loc Insight! Gostaria de alugar um equipamento:
--------------------------------------------
*Equipamento:* ${eq.name}
*Número de Série:* ${eq.serialNumber}
*Cliente:* ${currentUser?.name || ''}
*E-mail:* ${currentUser?.email || ''}
*Telefone:* ${clientPhone}${addExtra ? `\n\n*Itens de Adicionais sugeridos (Upsell):*${upsellSuggestion}` : ''}
--------------------------------------------
Solicito análise cadastral e contrato para envio ao endereço da obra. Obrigado!`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/5511999999999?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // ============================================================================
  // FILTRAGEM DO CATÁLOGO
  // ============================================================================
  const filteredEquipments = equipments.filter(eq => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.description && eq.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategoryFilter === '' || eq.categoryId === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === '' || eq.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Métricas do Dashboard (Admin)
  const totalEquips = equipments.length;
  const availEquips = equipments.filter(e => e.status === 'DISPONIVEL').length;
  const rentedEquips = equipments.filter(e => e.status === 'ALUGADO').length;
  const maintEquips = equipments.filter(e => e.status === 'MANUTENCAO').length;

  const occupancyRate = totalEquips > 0 ? Math.round((rentedEquips / totalEquips) * 100) : 0;

  // ============================================================================
  // RENDERIZAÇÃO: SISTEMA PRINCIPAL
  // ============================================================================
  const isAdmin = currentUser ? currentUser.role === 'ADMIN' : false;



  // Se a landing page está ativa, renderiza-a
  if (showLandingPage && !currentUser) {
    return (
      <div className="landing-page">
        {/* Mensagens de Feedback na landing */}
        {errorMessage && (
          <div className="alert alert-warning landing-alert">
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success landing-alert">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Partículas decorativas de fundo */}
        <div className="landing-particles">
          <div className="particle particle-1" />
          <div className="particle particle-2" />
          <div className="particle particle-3" />
          <div className="particle particle-4" />
        </div>

        {/* Conteúdo central */}
        <div className="landing-content">
          {/* Logo */}
          <div className="landing-logo-wrapper">
            <img src="/logo.svg" alt="Loc Insight" className="landing-logo" />
          </div>

          {/* Tagline */}
          <p className="landing-tagline">
            Gestão inteligente de locação de equipamentos
          </p>

          {/* Botões de Ação */}
          <div className="landing-actions">
            <button
              id="landing-btn-catalogo"
              className="landing-btn landing-btn-primary"
              onClick={() => setShowLandingPage(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" /><path d="M6 10h10" />
              </svg>
              Catálogo
            </button>

            <button
              id="landing-btn-login"
              className="landing-btn landing-btn-secondary"
              onClick={() => { setShowLandingPage(false); setShowLoginModal(true); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
              Login
            </button>
          </div>
        </div>

        {/* Modal de Login (reutilizado da app) */}
        {showLoginModal && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
            <div className="modal-box">
              <div className="modal-header">
                <h2 className="modal-title">Acessar o Painel</h2>
                <button onClick={() => setShowLoginModal(false)} className="modal-close-btn" aria-label="Fechar"><IconClose /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!loginEmail || !loginPassword) return;
                setLoading(true);
                try {
                  const user = await api.login(loginEmail, loginPassword);
                  setCurrentUser(user);
                  localStorage.setItem('locinsight_user', JSON.stringify(user));
                  setShowLoginModal(false);
                  setShowLandingPage(false);
                  if (user.role === 'ADMIN') setActiveTab('dashboard');
                  else setActiveTab('catalog');
                  triggerSuccess(`Bem-vindo, ${user.name}!`);
                } catch (err: any) {
                  triggerError(err.message || 'Dados de login inválidos');
                } finally {
                  setLoading(false);
                }
              }}>
                {/* Atalhos de Login Rápido */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button type="button" onClick={() => { setLoginEmail('admin@locinsight.com'); setLoginPassword('admin_password'); }} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '8px' }}>⚡ Admin</button>
                  <button type="button" onClick={() => { setLoginEmail('jose@construtorasilva.com'); setLoginPassword('senha123_criptografada'); }} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '8px' }}>⚡ Cliente</button>
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input id="login-email" type="email" className="form-control" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoFocus required />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Senha</label>
                  <input id="login-password" type="password" className="form-control" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                </div>
                <button id="login-submit-btn" type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar no Painel'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {currentUser && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      {currentUser && (
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>

          {/* Close button inside sidebar for mobile */}
          <div className="sidebar-mobile-header">
            <button onClick={() => setIsSidebarOpen(false)} className="sidebar-close-btn" aria-label="Fechar menu">
              <IconClose />
            </button>
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', height: '65px' }}>
            <img src="/logo.svg" alt="Loc Insight" style={{ maxWidth: '100%', objectFit: 'contain' }} />
          </div>

          {/* Info Usuário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
            <div style={{ background: isAdmin ? 'var(--secondary)' : 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {currentUser.name[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name}</h4>
              <span style={{ fontSize: '10px', color: isAdmin ? '#60a5fa' : 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {isAdmin ? 'Administrador' : 'Cliente Locatário'}
              </span>
            </div>
          </div>

          {/* Links Navegação */}
          <ul className="nav-links">
            <li>
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <IconDashboard /> Painel Operacional
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveTab('catalog'); setIsSidebarOpen(false); }}
                className={`nav-link-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              >
                <IconCatalog /> Catálogo Digital
              </button>
            </li>
          </ul>

          {/* Footer Sidebar */}
          <div className="sidebar-footer">
            {isAdmin && (
              <button
                onClick={handleSeedDatabase}
                className="seed-btn"
                style={{ marginBottom: '16px', fontSize: '11px' }}
                title="Apaga os dados atuais e reinicia o banco com dados limpos de teste"
              >
                🔄 Resetar Banco de Dados
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
              <IconLogOut /> Sair do Painel
            </button>
          </div>
        </aside>
      )}

      {/* MOBILE HEADER */}
      {currentUser && (
        <header className="mobile-header">
          <button onClick={() => setIsSidebarOpen(true)} className="mobile-menu-btn" aria-label="Abrir menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
          </button>
          <div className="mobile-header-logo">
            <img src="/logo.svg" alt="Loc Insight" style={{ height: '32px' }} />
          </div>
          <div style={{ background: isAdmin ? 'var(--secondary)' : 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
            {currentUser.name[0]}
          </div>
        </header>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">

        {/* Banner de Mensagens de Feedback */}
        {errorMessage && (
          <div className="alert alert-warning" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ====================================================================
            ABA 1: PAINEL OPERACIONAL (DASHBOARD)
            ==================================================================== */}
        {activeTab === 'dashboard' && (
          <div>
            <header className="content-header">
              <div>
                <h1 className="page-title">Painel Operacional</h1>
                <p className="page-subtitle">
                  {isAdmin ? 'Acompanhe ativos, ordens de manutenção preventiva/corretiva e contratos.' : 'Seu histórico de locações, faturas e pontos acumulados.'}
                </p>
              </div>

              {/* Botões de Ações Rápidas (Apenas Admin) */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowAddRentalModal(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)', boxShadow: 'none' }}>
                    <IconPlus /> Nova Locação
                  </button>
                  <button onClick={() => setShowAddEquipmentModal(true)} className="btn btn-primary">
                    <IconPlus /> Cadastrar Ativo
                  </button>
                </div>
              )}
            </header>

            {/* -------------------------------------------------------------
                DASHBOARD ADMINISTRATIVO
                ------------------------------------------------------------- */}
            {isAdmin ? (
              <div>

                {/* Indicadores Numéricos */}
                <section className="metrics-row">
                  <div className="metric-card">
                    <div className="metric-title">Frota Total</div>
                    <div className="metric-value">{totalEquips}</div>
                  </div>
                  <div className="metric-card success">
                    <div className="metric-title">Disponíveis</div>
                    <div className="metric-value">{availEquips}</div>
                  </div>
                  <div className="metric-card warning">
                    <div className="metric-title">Em Locação</div>
                    <div className="metric-value">{rentedEquips}</div>
                  </div>
                  <div className="metric-card danger">
                    <div className="metric-title">Em Manutenção</div>
                    <div className="metric-value">{maintEquips}</div>
                  </div>
                </section>

                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Ocupação da Frota em Campo</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{occupancyRate}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${occupancyRate}%`, background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} />
                  </div>
                </div>

                {/* Abas Administrativas */}
                <div className="tabs-header">
                  <button onClick={() => setAdminTab('rentals')} className={`tab-btn ${adminTab === 'rentals' ? 'active' : ''}`}>
                    Contratos de Locação ({rentals.filter(r => r.status === 'ACTIVE').length} ativos)
                  </button>
                  <button onClick={() => setAdminTab('equipments')} className={`tab-btn ${adminTab === 'equipments' ? 'active' : ''}`}>
                    Equipamentos ({equipments.length})
                  </button>
                  <button onClick={() => setAdminTab('maintenances')} className={`tab-btn ${adminTab === 'maintenances' ? 'active' : ''}`}>
                    Manutenções ({maintenances.filter(m => !m.endDate).length} abertas)
                  </button>
                  <button onClick={() => setAdminTab('categories')} className={`tab-btn ${adminTab === 'categories' ? 'active' : ''}`}>
                    Categorias
                  </button>
                  <button onClick={() => setAdminTab('users')} className={`tab-btn ${adminTab === 'users' ? 'active' : ''}`}>
                    Usuários ({users.length})
                  </button>
                </div>

                {/* ABA INTERNA: CONTRATOS/LOCAÇÕES */}
                {adminTab === 'rentals' && (
                  <div className="glass-card table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Equipamento / Série</th>
                          <th>Data Início</th>
                          <th>Devolução Esperada</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentals.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma locação encontrada.</td>
                          </tr>
                        ) : (
                          rentals.map(rental => (
                            <tr key={rental.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{rental.user?.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{rental.user?.email}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{rental.equipment?.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SN: {rental.equipment?.serialNumber}</div>
                              </td>
                              <td>{new Date(rental.startDate).toLocaleDateString('pt-BR')}</td>
                              <td>{new Date(rental.expectedReturn).toLocaleDateString('pt-BR')}</td>
                              <td>
                                <span className={`eq-status-badge ${rental.status === 'ACTIVE' ? 'status-alugado' : 'status-disponivel'}`} style={{ position: 'static' }}>
                                  {rental.status === 'ACTIVE' ? 'Ativo' : 'Finalizado'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {rental.status === 'ACTIVE' && (
                                  <button onClick={() => setShowReturnModal(rental.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex' }}>
                                    <IconCheck /> Devolução (Checklist)
                                  </button>
                                )}
                                {rental.status === 'FINISHED' && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Condição: <strong>{rental.conditionOnReturn}</strong>
                                    {rental.pointsEarned > 0 && ` (+${rental.pointsEarned} pts)`}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ABA INTERNA: EQUIPAMENTOS */}
                {adminTab === 'equipments' && (
                  <div className="glass-card table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Equipamento</th>
                          <th>Categoria</th>
                          <th>Nº de Série</th>
                          <th>Quantidade</th>
                          <th>Status</th>
                          <th>Manual Técnico</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipments.map(eq => (
                          <tr key={eq.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={eq.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=100'} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{eq.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.description || 'Sem descrição.'}</div>
                                </div>
                              </div>
                            </td>
                            <td>{eq.category?.name}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{eq.serialNumber}</td>
                            <td style={{ fontWeight: 600 }}>{eq.quantity}</td>
                            <td>
                              <span className={`eq-status-badge ${eq.status === 'DISPONIVEL' ? 'status-disponivel' : eq.status === 'ALUGADO' ? 'status-alugado' : 'status-manutencao'}`} style={{ position: 'static' }}>
                                {eq.status}
                              </span>
                            </td>
                            <td>
                              {eq.manualUrl ? (
                                <a href={`http://localhost:3000${eq.manualUrl}`} target="_blank" rel="noreferrer" className="points-badge" style={{ textDecoration: 'none', border: '1px solid var(--secondary)', color: '#60a5fa', background: 'rgba(96,165,250,0.05)' }}>
                                  <IconDownload /> Ver PDF
                                </a>
                              ) : (
                                <span style={{ color: 'var(--danger)', fontSize: '11px' }}>Falta PDF</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => openEditModal(eq)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                >
                                  Editar
                                </button>
                                {eq.status === 'DISPONIVEL' && (
                                  <button
                                    onClick={() => { setMaintEqId(eq.id); setShowAddMaintenanceModal(true); }}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                  >
                                    Manutenção
                                  </button>
                                )}
                                <button onClick={() => handleDeleteEquipment(eq.id)} className="btn btn-danger" style={{ padding: '6px' }} title="Excluir Ativo">
                                  <IconTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ABA INTERNA: MANUTENÇÕES */}
                {adminTab === 'maintenances' && (
                  <div className="glass-card table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Equipamento</th>
                          <th>Tipo</th>
                          <th>Data Início</th>
                          <th>Data Conclusão</th>
                          <th>Custo</th>
                          <th>Descrição / Peças</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenances.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma manutenção registrada.</td>
                          </tr>
                        ) : (
                          maintenances.map(m => (
                            <tr key={m.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{m.equipment?.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SN: {m.equipment?.serialNumber}</div>
                              </td>
                              <td>
                                <span className={`eq-status-badge ${m.type === 'PREVENTIVA' ? 'status-alugado' : 'status-manutencao'}`} style={{ position: 'static' }}>
                                  {m.type}
                                </span>
                              </td>
                              <td>{new Date(m.startDate).toLocaleDateString('pt-BR')}</td>
                              <td>{m.endDate ? new Date(m.endDate).toLocaleDateString('pt-BR') : <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Aberta</span>}</td>
                              <td style={{ fontWeight: 600 }}>R$ {m.cost.toFixed(2)}</td>
                              <td>
                                <div style={{ fontSize: '12px', fontWeight: 500 }}>{m.description}</div>
                                {m.partsReplaced && <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>Peças: {m.partsReplaced}</div>}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {!m.endDate && (
                                  <button onClick={() => setShowFinishMaintenanceModal(m.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex' }}>
                                    <IconCheck /> Concluir Manutenção
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ABA INTERNA: CATEGORIAS */}
                {adminTab === 'categories' && (
                  <div className="glass-card" style={{ maxWidth: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3>Categorias Cadastradas</h3>
                      <button onClick={() => setShowAddCategoryModal(true)} className="btn btn-primary" style={{ padding: '8px 14px' }}>
                        <IconPlus /> Adicionar Categoria
                      </button>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nome da Categoria</th>
                          <th>ID do Banco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{c.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ABA INTERNA: USUÁRIOS */}
                {adminTab === 'users' && (
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3>Usuários Cadastrados</h3>
                      <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary" style={{ padding: '8px 14px' }}>
                        <IconPlus /> Cadastrar Usuário
                      </button>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Função</th>
                            <th>Pontos (Fidelidade)</th>
                            <th>Criado em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum usuário cadastrado.</td>
                            </tr>
                          ) : (
                            users.map(u => (
                              <tr key={u.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                  <span className={`eq-status-badge ${u.role === 'ADMIN' ? 'status-disponivel' : 'status-alugado'}`} style={{ position: 'static' }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td>{u.role === 'CLIENT' ? `${u.points} pts` : '-'}</td>
                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // -------------------------------------------------------------
              // DASHBOARD DO CLIENTE
              // -------------------------------------------------------------
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

                {/* Bloco de Fidelização (PB13 / PB14 / motor de bonificação) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                  {/* Cartão de Pontos Acumulados */}
                  <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(242, 122, 34, 0.12) 0%, rgba(10, 82, 148, 0.05) 100%)', border: '1px solid rgba(242, 122, 34, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Fidelidade Loc Insight</span>
                        <div className="points-badge">
                          <IconStar /> <span style={{ fontWeight: 800 }}>CLIENTE VIP</span>
                        </div>
                      </div>
                      <h2 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Seu Saldo de Pontos</h2>
                      <div style={{ fontSize: '64px', fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        {currentUser?.points ?? 0}
                        <span style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>pontos</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '24px', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                      💡 <strong>Como ganhar pontos?</strong> Faça devoluções dentro do prazo e sem avarias (BOM estado) para ganhar <strong>10 pontos</strong> automáticos a cada aluguel!
                    </p>
                  </div>

                  {/* Formulário de Resgate de Pontos (PB14) */}
                  <div className="glass-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Resgatar Descontos</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                      Troque seus pontos acumulados por descontos na próxima locação.
                      Cada ponto vale <strong>R$ 0,20</strong>.
                    </p>

                    <form onSubmit={handleRedeemPoints}>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Quantidade a Resgatar</label>
                        <select
                          className="form-control"
                          value={pointsToRedeem}
                          onChange={e => setPointsToRedeem(Number(e.target.value))}
                        >
                          <option value={10}>10 pontos (R$ 2,00 desc.)</option>
                          <option value={50}>50 pontos (R$ 10,00 desc.)</option>
                          <option value={100}>100 pontos (R$ 20,00 desc.)</option>
                          <option value={200}>200 pontos (R$ 40,00 desc.)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Valor do desconto:</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>R$ {(pointsToRedeem * 0.20).toFixed(2)}</span>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px' }}
                        disabled={loading || !currentUser || currentUser.points < pointsToRedeem}
                      >
                        {!currentUser || currentUser.points < pointsToRedeem ? 'Pontos Insuficientes' : 'Resgatar Desconto Agora'}
                      </button>
                    </form>
                  </div>

                </div>

                {/* Locações do Cliente */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Seu Histórico de Locações</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Equipamento</th>
                          <th>Data Início</th>
                          <th>Devolução Prevista</th>
                          <th>Devolução Realizada</th>
                          <th>Status</th>
                          <th>Pontos Ganhos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentals.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Você ainda não realizou locações. Acessar catálogo para solicitar.</td>
                          </tr>
                        ) : (
                          rentals.map(rental => (
                            <tr key={rental.id}>
                              <td style={{ fontWeight: 600 }}>{rental.equipment?.name}</td>
                              <td>{new Date(rental.startDate).toLocaleDateString('pt-BR')}</td>
                              <td>{new Date(rental.expectedReturn).toLocaleDateString('pt-BR')}</td>
                              <td>{rental.actualReturn ? new Date(rental.actualReturn).toLocaleDateString('pt-BR') : '-'}</td>
                              <td>
                                <span className={`eq-status-badge ${rental.status === 'ACTIVE' ? 'status-alugado' : 'status-disponivel'}`} style={{ position: 'static' }}>
                                  {rental.status === 'ACTIVE' ? 'Em uso' : 'Devolvido'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--warning)' }}>
                                {rental.status === 'FINISHED' ? (
                                  rental.pointsEarned > 0 ? `+${rental.pointsEarned} pts` : '0 (Avariado)'
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Pendente</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ====================================================================
            ABA 2: CATÁLOGO DIGITAL (CATALOG)
            ==================================================================== */}
        {activeTab === 'catalog' && (
          <div>
            {/* Barra de Navegação Superior Pública */}
            {!currentUser && (
              <div className="glass-card public-nav-bar">
                <div className="public-nav-logo">
                  <img src="/logo.svg" alt="Loc Insight" />
                </div>
                <button onClick={() => setShowLoginModal(true)} className="btn btn-primary public-nav-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Entrar / Login
                </button>
              </div>
            )}

            <header className="content-header">
              <div>
                <h1 className="page-title">Catálogo de Equipamentos</h1>
                <p className="page-subtitle">
                  {isAdmin ? 'Gerencie o catálogo completo e status operacionais dos ativos.' : 'Filtre e selecione o equipamento ideal e solicite no WhatsApp da locadora.'}
                </p>
              </div>
            </header>

            {/* Controles de Busca e Filtros */}
            <div className="glass-card catalog-controls">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por nome do produto ou número de série..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />

              <select
                className="select-input"
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {isAdmin && (
                <select
                  className="select-input"
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="">Todos os Status</option>
                  <option value="DISPONIVEL">Disponível</option>
                  <option value="ALUGADO">Alugado</option>
                  <option value="MANUTENCAO">Manutenção</option>
                </select>
              )}
            </div>

            {/* Grid do Catálogo */}
            <div className="equipments-grid">
              {filteredEquipments.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Nenhum equipamento corresponde aos filtros aplicados.
                </div>
              ) : (
                filteredEquipments.map(eq => (
                  <div key={eq.id} className="eq-card">

                    {/* Imagem e Status */}
                    <div className="eq-image-container">
                      <img
                        className="eq-image"
                        src={eq.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400'}
                        alt={eq.name}
                      />
                      <span className={`eq-status-badge ${eq.status === 'DISPONIVEL' ? 'status-disponivel' : eq.status === 'ALUGADO' ? 'status-alugado' : 'status-manutencao'}`}>
                        {eq.status}
                      </span>
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="eq-details">
                      <span className="eq-category">{eq.category?.name || 'Geral'}</span>
                      <h3 className="eq-title">{eq.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="eq-serial" style={{ marginBottom: 0 }}>Série: {eq.serialNumber}</span>
                        <span className="eq-serial" style={{ marginBottom: 0, fontWeight: 700, color: 'var(--primary)' }}>Qtd: {eq.quantity}</span>
                      </div>
                      <p className="eq-desc">{eq.description || 'Sem descrição técnica no momento.'}</p>

                      <div className="eq-actions">

                        {/* Botão do Manual (PB07) */}
                        {eq.manualUrl ? (
                          <a
                            href={`http://localhost:3000${eq.manualUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                          >
                            <IconDownload /> Manual
                          </a>
                        ) : (
                          <button className="btn btn-secondary" disabled style={{ flex: 1 }}>Sem Manual</button>
                        )}

                        {/* Ação Principal: WhatsApp para Cliente ou Ação Admin */}
                        {isAdmin ? (
                          <button
                            onClick={() => { setMaintEqId(eq.id); setShowAddMaintenanceModal(true); }}
                            className="btn btn-primary"
                            style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)', boxShadow: 'none' }}
                            disabled={eq.status !== 'DISPONIVEL'}
                          >
                            Reparo
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestWhatsAppCheckout(eq)}
                            className="btn btn-primary"
                            disabled={eq.status !== 'DISPONIVEL'}
                          >
                            <IconWhatsApp /> Alugar (WA)
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </main>

      {/* ====================================================================
          MODAIS E DIÁLOGOS DE AÇÕES
          ==================================================================== */}

      {/* 1. Modal: Cadastrar Equipamento (PB01) */}
      {showAddEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Equipamento</h3>
              <button onClick={() => setShowAddEquipmentModal(false)} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleAddEquipment}>
              <div className="form-group">
                <label className="form-label">Nome do Ativo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Martelete Demolidor SDS Max 10kg"
                  value={eqName}
                  onChange={e => setEqName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    className="form-control"
                    value={eqCategory}
                    onChange={e => setEqCategory(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Série *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: MAR-010-999"
                    value={eqSerial}
                    onChange={e => setEqSerial(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Ex: 1"
                    value={eqQuantity}
                    onChange={e => setEqQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição Técnica</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Especificações do motor, potência, uso recomendado..."
                  value={eqDescription}
                  onChange={e => setEqDescription(e.target.value)}
                />
              </div>

              {/* RN05: Manual Técnico PDF é obrigatório */}
              <div className="form-group">
                <label className="form-label">Manual Técnico (PDF) * <span style={{ color: 'var(--primary)', fontSize: '11px' }}>(Obrigatório)</span></label>
                <div className="file-upload-wrapper">
                  <div className="file-upload-btn">📂 Escolher Arquivo PDF</div>
                  <input
                    type="file"
                    ref={manualInputRef}
                    className="file-upload-input"
                    accept=".pdf"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Foto do Equipamento</label>
                <div className="file-upload-wrapper">
                  <div className="file-upload-btn">📷 Escolher Imagem (JPG/PNG)</div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="file-upload-input"
                    accept="image/*"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddEquipmentModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Criar Nova Categoria */}
      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Adicionar Categoria</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleAddCategory}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Nome da Categoria</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Escavação e Terraplanagem"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddCategoryModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Nova Locação (Admin) */}
      {showAddRentalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Novo Contrato</h3>
              <button onClick={() => setShowAddRentalModal(false)} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleAddRental}>
              <div className="form-group">
                <label className="form-label">Equipamento Disponível *</label>
                <select
                  className="form-control"
                  value={rentalEqId}
                  onChange={e => setRentalEqId(e.target.value)}
                  required
                >
                  <option value="">Selecione um item da frota...</option>
                  {equipments.filter(e => e.status === 'DISPONIVEL').map(e => (
                    <option key={e.id} value={e.id}>{e.name} (SN: {e.serialNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Cliente *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: José da Silva"
                  value={rentalClientName}
                  onChange={e => setRentalClientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail do Cliente *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Ex: jose@construtora.com"
                  value={rentalClientEmail}
                  onChange={e => setRentalClientEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Devolução Esperada *</label>
                <input
                  type="date"
                  className="form-control"
                  value={rentalExpectedReturn}
                  onChange={e => setRentalExpectedReturn(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddRentalModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Fechar Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Devolução / Checklist (RN03 / RN04) */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">Checklist de Devolução</h3>
              <button onClick={() => setShowReturnModal(null)} className="modal-close"><IconClose /></button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
              Avalie o estado de conservação do equipamento na devolução da obra.
              Esta etapa é obrigatória para finalizar o contrato.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <button
                onClick={() => handleReturnRental('BOM')}
                className="btn btn-primary"
                style={{ padding: '16px', fontSize: '15px' }}
                disabled={loading}
              >
                ✅ Bom Estado (Gerar +10 Pontos de Fidelidade)
              </button>

              <button
                onClick={() => handleReturnRental('DANIFICADO')}
                className="btn btn-danger"
                style={{ padding: '16px', fontSize: '15px' }}
                disabled={loading}
              >
                ⚠️ Danificado / Com Avarias (Enviar para Manutenção)
              </button>
            </div>

            <button type="button" onClick={() => setShowReturnModal(null)} className="btn btn-secondary" style={{ width: '100%' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* 5. Modal: Abrir Manutenção (RN06) */}
      {showAddMaintenanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Enviar para Manutenção</h3>
              <button onClick={() => setShowAddMaintenanceModal(false)} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleAddMaintenance}>
              <div className="form-group">
                <label className="form-label">Equipamento *</label>
                <select
                  className="form-control"
                  value={maintEqId}
                  onChange={e => setMaintEqId(e.target.value)}
                  required
                >
                  <option value="">Selecione o equipamento...</option>
                  {equipments.filter(e => e.status === 'DISPONIVEL' || e.id === maintEqId).map(e => (
                    <option key={e.id} value={e.id}>{e.name} (SN: {e.serialNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Revisão *</label>
                  <select
                    className="form-control"
                    value={maintType}
                    onChange={e => setMaintType(e.target.value)}
                  >
                    <option value="PREVENTIVA">Preventiva</option>
                    <option value="CORRETIVA">Corretiva</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Custo Inicial Estimado</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={maintCost}
                    onChange={e => setMaintCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição do Problema / Tarefas *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Detalhe o que precisa ser feito..."
                  value={maintDescription}
                  onChange={e => setMaintDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Peças a Substituir (Se houver)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Filtro de ar, vela de ignição, óleo 20W50"
                  value={maintParts}
                  onChange={e => setMaintParts(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddMaintenanceModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Abrir Ordem de Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Finalizar Manutenção */}
      {showFinishMaintenanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Concluir Ordem de Serviço</h3>
              <button onClick={() => setShowFinishMaintenanceModal(null)} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleFinishMaintenance}>
              <div className="form-group">
                <label className="form-label">Custo Final do Reparo *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={finishMaintCost}
                  onChange={e => setFinishMaintCost(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Peças Efetivamente Substituídas</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Filtro trocado, velas e limpeza efetuada."
                  value={finishMaintParts}
                  onChange={e => setFinishMaintParts(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowFinishMaintenanceModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Finalizar e Disponibilizar Ativo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Upsell Sugerido & Checkout WhatsApp (Skill Operacional) */}
      {showUpsellModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ border: '1px solid var(--primary)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(242,122,34,0.1)', paddingBottom: '12px' }}>
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                ⭐ Recomendação Operacional
              </h3>
              <button onClick={() => setShowUpsellModal(null)} className="modal-close"><IconClose /></button>
            </div>

            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '12px' }}>
                Deseja adicionar acessórios recomendados para o aluguel do seu {showUpsellModal.name}?
              </p>

              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'left', border: '1px dashed var(--border-color)', margin: '16px 0', fontSize: '13px' }}>
                {showUpsellModal.name.toLowerCase().includes('betoneira') || showUpsellModal.name.toLowerCase().includes('andaime') ? (
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Recomendado para esta categoria:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>Cabo de Extensão Elétrica Reforçado (15 metros)</li>
                      <li>Kit EPI Básico (Capacete, Luvas de Proteção e Óculos)</li>
                    </ul>
                  </div>
                ) : showUpsellModal.name.toLowerCase().includes('gerador') ? (
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Recomendado para esta categoria:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>Galão de Combustível Reserva (10 Litros)</li>
                      <li>Mangueira de Compressor de Alta Pressão</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Recomendado:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>Kit de Ferramentas e Peças Sobressalentes de uso</li>
                      <li>Equipamentos de proteção Individual</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleConfirmWhatsAppRental(showUpsellModal, true)}
                className="btn btn-primary"
                style={{ padding: '12px' }}
              >
                Sim, adicionar recomendados e ir ao WhatsApp
              </button>

              <button
                onClick={() => handleConfirmWhatsAppRental(showUpsellModal, false)}
                className="btn btn-secondary"
                style={{ padding: '12px' }}
              >
                Não, quero apenas o equipamento principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Login do Sistema (Para Usuários Não Logados) */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%', padding: '32px' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logo.svg" alt="Loc Insight" style={{ height: '32px', objectFit: 'contain' }} />
                <h3 className="modal-title">Acesso ao Sistema</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="modal-close" style={{ marginLeft: 'auto' }}><IconClose /></button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Faça login para realizar solicitações de locação no WhatsApp e acompanhar seus pontos.
            </p>

            {errorMessage && (
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">E-mail Corporativo</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="nome@empresa.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Senha de Acesso</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Digite sua senha"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>

            {/* Login Rápido de Teste */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                Acesso Rápido de Demonstração
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { loginQuickly('ADMIN'); }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '11px', border: '1px solid var(--secondary)' }}
                >
                  Conta Admin
                </button>
                <button
                  type="button"
                  onClick={() => { loginQuickly('CLIENT'); }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '11px', border: '1px solid var(--primary)' }}
                >
                  Conta Cliente
                </button>
              </div>

              <button
                type="button"
                onClick={handleSeedDatabase}
                className="seed-btn"
                style={{ marginTop: '12px', width: '100%', fontSize: '11px' }}
              >
                🔄 Restaurar Banco de Dados de Teste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Cadastrar Novo Usuário (Admin) */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%', padding: '32px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Usuário</h3>
              <button onClick={() => setShowAddUserModal(false)} className="modal-close"><IconClose /></button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Crie credenciais de acesso para um novo administrador ou cliente.
            </p>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Carlos Oliveira"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail de Acesso *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Ex: carlos@empresa.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Função (Role) *</label>
                  <select
                    className="form-control"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as 'ADMIN' | 'CLIENT')}
                    required
                  >
                    <option value="CLIENT">Cliente (CLIENT)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Senha Inicial *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Equipamento */}
      {showEditEquipmentModal && editingEquipment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Editar Equipamento</h3>
              <button onClick={() => { setShowEditEquipmentModal(false); setEditingEquipment(null); }} className="modal-close"><IconClose /></button>
            </div>

            <form onSubmit={handleEditEquipment}>
              <div className="form-group">
                <label className="form-label">Nome do Ativo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Martelete Demolidor SDS Max 10kg"
                  value={editEqName}
                  onChange={e => setEditEqName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    className="form-control"
                    value={editEqCategory}
                    onChange={e => setEditEqCategory(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Série *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: MAR-010-999"
                    value={editEqSerial}
                    onChange={e => setEditEqSerial(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Ex: 1"
                    value={editEqQuantity}
                    onChange={e => setEditEqQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-control"
                    value={editEqStatus}
                    onChange={e => setEditEqStatus(e.target.value as 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO')}
                    required
                  >
                    <option value="DISPONIVEL">Disponível</option>
                    <option value="ALUGADO">Alugado</option>
                    <option value="MANUTENCAO">Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição Técnica</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Especificações do motor, potência, uso recomendado..."
                  value={editEqDescription}
                  onChange={e => setEditEqDescription(e.target.value)}
                />
              </div>

              {/* No modal de edição, os arquivos de PDF e Imagem são opcionais */}
              <div className="form-group">
                <label className="form-label">Manual Técnico (PDF) <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Deixe em branco para manter o atual)</span></label>
                <div className="file-upload-wrapper">
                  <div className="file-upload-btn">📂 Alterar Arquivo PDF</div>
                  <input
                    type="file"
                    ref={editManualInputRef}
                    className="file-upload-input"
                    accept=".pdf"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Foto do Equipamento <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Deixe em branco para manter a atual)</span></label>
                <div className="file-upload-wrapper">
                  <div className="file-upload-btn">📷 Alterar Imagem (JPG/PNG)</div>
                  <input
                    type="file"
                    ref={editImageInputRef}
                    className="file-upload-input"
                    accept="image/*"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowEditEquipmentModal(false); setEditingEquipment(null); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
