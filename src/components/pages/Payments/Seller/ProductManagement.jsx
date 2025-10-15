import { useState, useEffect } from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import HeaderComponent from "../../../common/HeaderComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import CardComponent from "../../../common/CardComponent";
import InputComponent from "../../../common/InputComponent";
import ModalComponent from "../../../common/ModalComponent";
import Pagination from "../../../common/Pagination";
import { useApi } from "../../../../utils/api/useApi";
import { useModal } from "../../../../context/ModalContext";
import styles from "./ProductManagement.module.css";

export default function ProductManagement() {
    const { GET, POST, PUT, DELETE } = useApi();
    const { showBasicModal, showConfirmModal } = useModal();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    
    // 상품 등록/수정 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        imageUrl: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        loadProducts();
    }, [currentPage, searchTerm, categoryFilter]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await GET('/seller/products', {
                page: currentPage,
                search: searchTerm,
                category: categoryFilter
            });
            
            setProducts(response.data?.products || []);
            setTotalPages(response.data?.totalPages || 1);
        } catch (error) {
            console.error('상품 목록 로드 실패:', error);
            setProducts([]);
            setTotalPages(1);
            showBasicModal('상품 목록을 불러오는데 실패했습니다.', '오류');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // 이미지 파일 처리 함수
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 크기 제한 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showBasicModal('이미지 파일 크기는 5MB를 초과할 수 없습니다.', '오류');
                return;
            }
            
            // 이미지 파일 타입 확인
            if (!file.type.startsWith('image/')) {
                showBasicModal('이미지 파일만 업로드 가능합니다.', '오류');
                return;
            }
            
            setImageFile(file);
            
            // 미리보기 생성
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 이미지를 Base64로 변환하는 함수
    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleCategoryFilter = (e) => {
        setCategoryFilter(e.target.value);
        setCurrentPage(1);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setProductForm({
            name: "",
            description: "",
            price: "",
            category: "",
            stock: "",
            imageUrl: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.productName,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            stock: product.stock.toString(),
            imageUrl: product.imageUrl || ""
        });
        setIsModalOpen(true);
    };

    const handleFormChange = (field) => (e) => {
        setProductForm(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const resetForm = () => {
        setProductForm({
            name: "",
            description: "",
            price: "",
            category: "",
            stock: "",
            imageUrl: ""
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let imageData = null;
            
            // 이미지 파일이 있으면 Base64로 변환
            if (imageFile) {
                imageData = await convertImageToBase64(imageFile);
            }
            
            const productData = {
                ...productForm,
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock),
                imageData: imageData // Base64 이미지 데이터
            };

            if (editingProduct) {
                await PUT(`/seller/products/${editingProduct.id}`, productData);
                showBasicModal('상품이 수정되었습니다.', '성공');
            } else {
                await POST('/seller/products', productData);
                showBasicModal('상품이 등록되었습니다.', '성공');
            }
            
            setIsModalOpen(false);
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('상품 저장 실패:', error);
            showBasicModal('상품 저장에 실패했습니다.', '오류');
        }
    };

    const handleDelete = (product) => {
        showConfirmModal(
            `"${product.productName}" 상품을 삭제하시겠습니까?`,
            "상품 삭제",
            "삭제된 상품은 복구할 수 없습니다.",
            async () => {
                try {
                    await DELETE(`/seller/products/${product.productId}`);
                    showBasicModal('상품이 삭제되었습니다.', '성공');
                    loadProducts();
                } catch (error) {
                    console.error('상품 삭제 실패:', error);
                    showBasicModal('상품 삭제에 실패했습니다.', '오류');
                }
            }
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    if (loading) {
        return (
            <ContainerComponent variant="default" className="p-4">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">로딩중...</span>
                    </div>
                </div>
            </ContainerComponent>
        );
    }

    return (
        <ContainerComponent variant="default" className="p-4">
            <HeaderComponent variant="filled" size="medium" className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <h2 className="mb-0">상품 관리</h2>
                    <ButtonComponent 
                        variant="primary" 
                        size="small"
                        onClick={openAddModal}
                    >
                        상품 등록
                    </ButtonComponent>
                </div>
            </HeaderComponent>

            {/* 검색 및 필터 */}
            <CardComponent variant="outlined" className="mb-4">
                <div className="p-3">
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <InputComponent
                                label="상품명 검색"
                                placeholder="상품명을 입력하세요"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">카테고리</label>
                            <select 
                                className="form-select"
                                value={categoryFilter}
                                onChange={handleCategoryFilter}
                            >
                                <option value="all">전체</option>
                                <option value="fitness">피트니스</option>
                                <option value="nutrition">영양제</option>
                                <option value="equipment">운동기구</option>
                                <option value="clothing">운동복</option>
                            </select>
                        </div>
                        <div className="col-md-2 mb-3 d-flex align-items-end">
                            <ButtonComponent 
                                variant="outline" 
                                size="small"
                                onClick={loadProducts}
                                className="w-100"
                            >
                                검색
                            </ButtonComponent>
                        </div>
                    </div>
                </div>
            </CardComponent>

            {/* 상품 목록 */}
            <div className="row">
                {products && Array.isArray(products) && products.map((product) => (
                    <div key={product.productId} className="col-md-6 col-lg-4 mb-4">
                        <CardComponent variant="outlined" className="h-100">
                            <div className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h5 className="mb-0">{product.productName}</h5>
                                    <div className="dropdown">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                            type="button"
                                            data-bs-toggle="dropdown"
                                        >
                                            관리
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li>
                                                <button 
                                                    className="dropdown-item"
                                                    onClick={() => openEditModal(product)}
                                                >
                                                    수정
                                                </button>
                                            </li>
                                            <li>
                                                <button 
                                                    className="dropdown-item text-danger"
                                                    onClick={() => handleDelete(product)}
                                                >
                                                    삭제
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                {product.imageData && (
                                    <div className="mb-3">
                                        <img 
                                            src={product.imageData} 
                                            alt={product.productName}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                
                                <p className="text-muted small mb-2">{product.description}</p>
                                
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="fw-bold text-primary">
                                            {formatCurrency(product.price)}
                                        </div>
                                        <small className="text-muted">
                                            재고: {product.stock}개
                                        </small>
                                    </div>
                                    <span className="badge bg-secondary">
                                        {product.category}
                                    </span>
                                </div>
                            </div>
                        </CardComponent>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <CardComponent variant="outlined">
                    <div className="text-center py-5">
                        <p className="text-muted">등록된 상품이 없습니다.</p>
                        <ButtonComponent 
                            variant="primary" 
                            size="small"
                            onClick={openAddModal}
                        >
                            첫 상품 등록하기
                        </ButtonComponent>
                    </div>
                </CardComponent>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* 상품 등록/수정 모달 */}
            <ModalComponent
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? "상품 수정" : "상품 등록"}
                size="large"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <InputComponent
                                label="상품명"
                                placeholder="상품명을 입력하세요"
                                value={productForm.name}
                                onChange={handleFormChange("name")}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <InputComponent
                                label="가격"
                                type="number"
                                placeholder="가격을 입력하세요"
                                value={productForm.price}
                                onChange={handleFormChange("price")}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">카테고리</label>
                            <select 
                                className="form-select"
                                value={productForm.category}
                                onChange={handleFormChange("category")}
                                required
                            >
                                <option value="">카테고리를 선택하세요</option>
                                <option value="fitness">피트니스</option>
                                <option value="nutrition">영양제</option>
                                <option value="equipment">운동기구</option>
                                <option value="clothing">운동복</option>
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <InputComponent
                                label="재고 수량"
                                type="number"
                                placeholder="재고 수량을 입력하세요"
                                value={productForm.stock}
                                onChange={handleFormChange("stock")}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <InputComponent
                            label="상품 설명"
                            placeholder="상품에 대한 설명을 입력하세요"
                            value={productForm.description}
                            onChange={handleFormChange("description")}
                            required
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="form-label">상품 이미지</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img 
                                    src={imagePreview} 
                                    alt="미리보기"
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="d-flex justify-content-end gap-2">
                        <ButtonComponent 
                            variant="outline" 
                            size="small"
                            onClick={() => setIsModalOpen(false)}
                        >
                            취소
                        </ButtonComponent>
                        <ButtonComponent 
                            variant="primary" 
                            size="small"
                            type="submit"
                        >
                            {editingProduct ? "수정" : "등록"}
                        </ButtonComponent>
                    </div>
                </form>
            </ModalComponent>
        </ContainerComponent>
    );
}
