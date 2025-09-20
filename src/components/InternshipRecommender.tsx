import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MapPin, Building2, GraduationCap, Search, Sparkles, TrendingUp, Target } from 'lucide-react';

interface RecommendationResult {
  title: string;
  company: string;
  location: string;
  match_score: number;
  skills_required: string[];
  description: string;
}

const InternshipRecommender = () => {
  const [formData, setFormData] = useState({
    skills: '',
    sector: '',
    location: '',
    education: ''
  });
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // This would connect to your existing API endpoint
      const response = await fetch('https://internship-recommender-sase.onrender.com/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse primary-gradient rounded-full blur-xl opacity-30" />
                <Target className="relative h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Find Your Perfect
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent block">
                Internship Match
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover personalized internship opportunities tailored to your skills, interests, and career goals using AI-powered recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Personalized Results</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Perfect Career Fit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="gradient-card hover-lift">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Tell Us About Yourself</CardTitle>
            <CardDescription>
              Fill in your details to get personalized internship recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Skills
                  </label>
                  <Input
                    placeholder="e.g., Python, Machine Learning, Data Analysis"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Sector Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Sector
                  </label>
                  <Input
                    placeholder="e.g., Technology, Finance, Healthcare"
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location
                  </label>
                  <Input
                    placeholder="e.g., New York, Remote, San Francisco"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Education Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Education Level
                  </label>
                  <Input
                    placeholder="e.g., Bachelor's, Master's, High School"
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full primary-gradient hover:opacity-90 transition-opacity text-white font-semibold py-6"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Finding Your Perfect Match...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Find Personalized Internships
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              Your Personalized Recommendations
            </h2>
            <div className="grid gap-6">
              {results.map((result, index) => (
                <Card key={index} className="gradient-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {result.title}
                        </h3>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {result.company}
                          <span className="text-border">•</span>
                          <MapPin className="h-4 w-4" />
                          {result.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {Math.round(result.match_score * 100)}% Match
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {result.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {result.skills_required.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipRecommender;