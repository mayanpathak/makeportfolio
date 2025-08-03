import { useState } from "react";
import { motion } from "framer-motion";
import { X, Rocket, Loader2, CheckCircle, Share2, Twitter, Linkedin, Facebook, Link2, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { ColorTheme } from "@/lib/colorThemes";
import { useUser } from "@clerk/nextjs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { newPortfolioData } from "@/slices/dataSlice";
import { updatePortfolio, deployPortfolio, checkUserSubdomain } from "@/app/actions/portfolio";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioData: any;
  portfolioLink?: string;
}

const DeployModal = ({ isOpen, onClose, portfolioId, portfolioData, portfolioLink }: DeployModalProps) => {
  const { user } = useUser();
  const dispatch = useDispatch();
  const [isDeploying, setIsDeploying] = useState(false);
  const [portfolioSlug, setPortfolioSlug] = useState("");
  const [portfolioSubdomain, setPortfolioSubdomain] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState("");
  const [activeTab, setActiveTab] = useState("slug");

  const validatePortfolioSlug = (slug: string) => {
    if (slug.length < 3 || slug.length > 30) {
      toast.error("Portfolio slug must be between 3 and 30 characters");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error("Portfolio slug can only contain lowercase letters, numbers, and hyphens");
      return false;
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
      toast.error("Portfolio slug cannot start or end with a hyphen");
      return false;
    }
    return true;
  };

  const validateSubdomain = (subdomain: string) => {
    if (subdomain.length < 3 || subdomain.length > 30) {
      toast.error("Subdomain must be between 3 and 30 characters");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return false;
    }
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      toast.error("Subdomain cannot start or end with a hyphen");
      return false;
    }
    return true;
  };

  const handleDeploy = async () => {
    if(!user) {
      return;
    }

    const isSubdomain = activeTab === "subdomain";
    const value = isSubdomain ? portfolioSubdomain : portfolioSlug;

    if (!value) {
      toast.error(`Please enter a ${isSubdomain ? "subdomain" : "portfolio slug"}`);
      return;
    }

    if (isSubdomain && !validateSubdomain(value)) {
      return;
    } else if (!isSubdomain && !validatePortfolioSlug(value)) {
      return;
    }

    // Check for existing subdomain deployment if user is trying to deploy with subdomain
    if (isSubdomain) {
      try {
        const result = await checkUserSubdomain(user.id);
        if (!result.success) {
          toast.error("Failed to verify subdomain availability");
          return;
        }
        
        if (result.isPremium) {
          if (result.hasSubdomain) {
            toast.error(`You have reached the maximum limit of 10 subdomains for premium users.`);
            return;
          }
          toast.success(`Premium user: ${10 - (result.currentCount || 0)} subdomains remaining.`);
        } else {
          if (result.hasSubdomain) {
            toast.error("You have already deployed a portfolio with a subdomain. Free users can only have one subdomain deployment. Upgrade to premium to create up to 10 subdomains!");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking subdomain:", error);
        toast.error("Failed to verify subdomain availability");
        return;
      }
    }

    setIsDeploying(true);

    try {
      const result = await deployPortfolio(user.id, portfolioId, value, isSubdomain);
      if (result.success && result.data) {
        setIsDeployed(true);
        setDeployedUrl(result.data.url);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
        toast.success("Portfolio deployed successfully!");
      } else {
        toast.error(result.error || "Failed to deploy portfolio");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error("Failed to deploy portfolio");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Portfolio URL copied to clipboard!');
  };

  const handleShare = (platform: string, url: string) => {
    const text = "Check out my portfolio!";
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs"
    >
      {showConfetti && <Confetti />}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md p-6 rounded-xl shadow-xl backdrop-blur-xl"
        style={{ 
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          border: "1px solid rgba(75, 85, 99, 0.3)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.3), 0 10px 30px rgba(16, 185, 129, 0.15)"
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#2c2c2e] transition-colors"
          style={{ color: ColorTheme.textPrimary }}
        >
          <X size={20} />
        </button>

        {portfolioLink ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${ColorTheme.primary}20` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: ColorTheme.primary }} />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: ColorTheme.textPrimary }}>
              Portfolio Already Deployed!
            </h3>
            <p className="mb-6" style={{ color: ColorTheme.textSecondary }}>
              Your portfolio is live and accessible at:
              <br />
              <motion.a
                href={portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] font-medium hover:underline inline-block mt-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {portfolioLink}
              </motion.a>
            </p>
            <div className="space-y-4">
              <motion.button
                className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: ColorTheme.primary,
                  color: "#000",
                  boxShadow: `0 4px 10px ${ColorTheme.primaryGlow}`,
                }}
                whileHover={{
                  boxShadow: `0 6px 14px ${ColorTheme.primaryGlow}`,
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (portfolioLink) {
                    window.open(portfolioLink, '_blank');
                  }
                }}
              >
                <Rocket className="h-4 w-4" />
                Visit Portfolio
              </motion.button>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium" style={{ color: ColorTheme.textSecondary }}>
                  Share your portfolio:
                </p>
                <div className="flex justify-center gap-2">
                  <motion.button
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: ColorTheme.bgCard,
                      color: ColorTheme.textPrimary,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('twitter', portfolioLink!)}
                  >
                    <Twitter className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: ColorTheme.bgCard,
                      color: ColorTheme.textPrimary,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('linkedin', portfolioLink!)}
                  >
                    <Linkedin className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: ColorTheme.bgCard,
                      color: ColorTheme.textPrimary,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('facebook', portfolioLink!)}
                  >
                    <Facebook className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: ColorTheme.bgCard,
                      color: ColorTheme.textPrimary,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyUrl(portfolioLink!)}
                  >
                    <Link2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: ColorTheme.textPrimary }}
            >
              Deploy Your Portfolio
            </h2>

            {!isDeployed ? (
              <Tabs defaultValue="slug" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList 
                  className="w-full grid grid-cols-2 mb-6 border rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: ColorTheme.bgNav,
                    borderColor: 'rgba(75, 85, 99, 0.3)',
                  }}
                >
                  <TabsTrigger 
                    value="slug"
                    className="data-[state=active]:bg-gray-700 rounded-l-lg cursor-pointer"
                    style={{ 
                      color: ColorTheme.textPrimary,
                      borderRight: '1px solid rgba(75, 85, 99, 0.3)',
                    }}
                  >
                    Slug Deployment
                  </TabsTrigger>
                  <TabsTrigger 
                    value="subdomain"
                    className="data-[state=active]:bg-gray-700 relative rounded-r-lg cursor-pointer"
                    style={{ 
                      color: ColorTheme.textPrimary,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      Subdomain
                      <Crown className="w-4 h-4 text-yellow-400" />
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slug" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: ColorTheme.textPrimary }}>
                        Choose your portfolio slug
                      </label>
                      <div className="relative border border-[rgba(75,85,99,0.3)] rounded-lg overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full flex items-center px-4"
                          style={{ 
                            color: ColorTheme.primary,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          }}
                        >
                          craftfolio.live/p/
                        </div>
                        <input
                          type="text"
                          value={portfolioSlug}
                          onChange={(e) => setPortfolioSlug(e.target.value)}
                          placeholder="your-portfolio-slug"
                          className="w-full pl-[200px] pr-4 py-2 bg-[rgba(28,28,30,0.9)] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm" style={{ color: ColorTheme.textSecondary }}>
                          Your portfolio will be available at: https://craftfolio.live/p/{portfolioSlug || 'your-portfolio-slug'}
                        </p>
                        <div className="text-xs space-y-1 my-2" style={{ color: ColorTheme.textSecondary }}>
                          <p className="font-medium">Portfolio slug requirements:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Use only lowercase letters, numbers, and hyphens</li>
                            <li>Must be between 3-30 characters</li>
                            <li>Cannot start or end with a hyphen</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subdomain" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                      <div className="flex items-start gap-3">
                        <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-400 mb-1">Recommended Subdomain</h4>
                          <p className="text-sm" style={{ color: ColorTheme.textSecondary }}>
                            Get a professional subdomain for your portfolio, a highly recommended option. Free users get 1 free subdomain, while premium users can create up to 10 subdomains.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: ColorTheme.textPrimary }}>
                        Choose your subdomain
                      </label>
                      <div className="relative border border-[rgba(75,85,99,0.3)] rounded-lg overflow-hidden">
                        <div 
                          className="absolute right-0 top-0 h-full flex items-center px-4"
                          style={{ 
                            color: ColorTheme.primary,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          }}
                        >
                          .craftfolio.live
                        </div>
                        <input
                          type="text"
                          value={portfolioSubdomain}
                          onChange={(e) => setPortfolioSubdomain(e.target.value)}
                          placeholder="your-name"
                          className="w-full pr-[180px] pl-4 py-2 bg-[rgba(28,28,30,0.9)] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none transition-colors"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm" style={{ color: ColorTheme.textSecondary }}>
                          Your portfolio will be available at: https://{portfolioSubdomain || 'your-name'}.craftfolio.live
                        </p>
                        <div className="text-xs space-y-1 my-2" style={{ color: ColorTheme.textSecondary }}>
                          <p className="font-medium">Subdomain requirements:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Use only lowercase letters, numbers, and hyphens</li>
                            <li>Must be between 3-30 characters</li>
                            <li>Cannot start or end with a hyphen</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <motion.button
                  className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer mt-6"
                  style={{
                    backgroundColor: ColorTheme.primary,
                    color: "#000",
                    boxShadow: `0 4px 10px ${ColorTheme.primaryGlow}`,
                    opacity: isDeploying ? 0.7 : 1,
                    cursor: isDeploying ? "not-allowed" : "pointer"
                  }}
                  whileHover={{
                    boxShadow: isDeploying ? `0 4px 10px ${ColorTheme.primaryGlow}` : `0 6px 14px ${ColorTheme.primaryGlow}`,
                    scale: isDeploying ? 1 : 1.02,
                  }}
                  whileTap={{ scale: isDeploying ? 1 : 0.98 }}
                  onClick={handleDeploy}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Deploy Now
                    </>
                  )}
                </motion.button>
              </Tabs>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${ColorTheme.primary}20` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: ColorTheme.primary }} />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: ColorTheme.textPrimary }}>
                  Portfolio Deployed Successfully!
                </h3>
                <p className="mb-6" style={{ color: ColorTheme.textSecondary }}>
                  Your portfolio is now live and accessible at:
                  <br />
                  <motion.a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] font-medium hover:underline inline-block mt-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {deployedUrl}
                  </motion.a>
                </p>

                <div className="space-y-4">
                  <motion.button
                    className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: ColorTheme.primary,
                      color: "#000",
                      boxShadow: `0 4px 10px ${ColorTheme.primaryGlow}`,
                    }}
                    whileHover={{
                      boxShadow: `0 6px 14px ${ColorTheme.primaryGlow}`,
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (deployedUrl) {
                        window.open(deployedUrl, '_blank');
                      }
                    }}
                  >
                    <Rocket className="h-4 w-4" />
                    Visit Portfolio
                  </motion.button>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium" style={{ color: ColorTheme.textSecondary }}>
                      Share your portfolio:
                    </p>
                    <div className="flex justify-center gap-2">
                      <motion.button
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: ColorTheme.bgCard,
                          color: ColorTheme.textPrimary,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare('twitter', deployedUrl)}
                      >
                        <Twitter className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: ColorTheme.bgCard,
                          color: ColorTheme.textPrimary,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare('linkedin', deployedUrl)}
                      >
                        <Linkedin className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: ColorTheme.bgCard,
                          color: ColorTheme.textPrimary,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare('facebook', deployedUrl)}
                      >
                        <Facebook className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: ColorTheme.bgCard,
                          color: ColorTheme.textPrimary,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopyUrl(deployedUrl)}
                      >
                        <Link2 className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DeployModal; 